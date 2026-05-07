// server/src/routes/reportRoutes.js
// Live Report & BOM Excel Generation
// Reads from existing project data + systemCalc — no calc engine changes.

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('../config/mssql');
const configManager = require('../utils/configManager');
const logger = require('../utils/logger');

const tryParse = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
};

// Flatten {value, unit} objects → readable string; pass through primitives unchanged
const flatVal = (v, fallback = '—') => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'object' && 'value' in v) {
    const num = v.value;
    const u   = v.unit || '';
    if (num === '' || num === null || num === undefined) return fallback;
    return u ? `${num} ${u}` : String(num);
  }
  return v === '' ? fallback : String(v);
};

// Flatten {value, unit} objects → numeric value; pass through primitives
const flatNum = (v, fallback = 0) => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'object' && 'value' in v) {
    const n = parseFloat(v.value);
    return isNaN(n) ? fallback : n;
  }
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : (v ?? '—'));
const fmtDollar = (v) => (typeof v === 'number' ? `$${v.toFixed(2)}` : '—');

// ─── GET /api/reports/projects ────────────────────────────────────────────────
// Returns a lightweight list of user's projects for the selector dropdown.
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, projectNumber, projectName, customer_name, status, updatedAt
       FROM projects WHERE userId = ? ORDER BY updatedAt DESC`,
      [req.userId]
    );
    res.json({ success: true, projects: rows });
  } catch (err) {
    logger.error('reportRoutes /projects error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/reports/:projectId/live ────────────────────────────────────────
// Returns the full structured live-report payload from saved systemCalc data.
router.get('/:projectId/live', async (req, res) => {
  try {
    await configManager.loadConfigs();

    const [rows] = await db.query(`
      SELECT p.*, c.companyName as linkedCustomerName
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ? AND p.userId = ?
    `, [req.params.projectId, req.userId]);

    const project = rows[0];
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const parsedStairs = tryParse(project.stairs);
    project.stairs = Array.isArray(parsedStairs) ? parsedStairs : [];
    project.estimationResult = tryParse(project.estimationResult);

    // ── Rates Snapshot ──────────────────────────────────────────────────────
    const rates = {
      steelPerLb:      configManager.get('steel_price_per_lb', 0.75),
      shopPerHr:       configManager.get('shop_hourly_rate', 70),
      fieldPerHr:      configManager.get('field_hourly_rate', 70),
      galvanizePerLb:  configManager.get('galvanize_rate', 0.75),
      powderCoatPerLb: configManager.get('powder_coat_rate', 1.7587),
      scrapPct:        configManager.get('scrap_factor_pct', 10),
      taxPct:          configManager.get('tax_rate', 0.06) * 100,
      anchorBoltRate:  configManager.get('anchor_bolt_rate', 0.025),
      embeddedRate:    configManager.get('mounting_embedded_rate', 5.00),
      anchoredRate:    configManager.get('mounting_anchored_rate', 6.00),
    };

    // ── Flatten stairs / rails / platforms from saved JSON ─────────────────
    const allStairs = [];
    const allRails = [];
    const allPlatforms = [];

    let totalRisers = 0;

    (project.stairs || []).forEach((stair, si) => {
      // Stair-level systemCalc
      const sc = stair.systemCalc || {};
      allStairs.push({
        index: si + 1,
        label: stair.stairName || stair.label || `Stair ${si + 1}`,
        stairType: flatVal(stair.stairType),
        category: flatVal(stair.category || stair.stairCategory),
        width: flatVal(stair.stairWidth || stair.width),
        risers: sc.risers || stair.risers || 0,
        run: flatVal(stair.run),
        rise: flatVal(stair.rise),
        connection: flatVal(stair.connectionType || stair.mountingType),
        stringerSize: flatVal(stair.stringerSize),
        angle: flatVal(stair.slope || sc.angle),
        // BOM fields
        steelLbsPerLF: sc.stringerLbsPerFt || sc.steelLbsPerLF || 0,
        stringerLFTotal: sc.totalLFBothStringers || 0,
        panAreaSqFt: sc.panArea || 0,
        // Weights
        stringerLbs: sc.totalSteel || sc.baseSteelLbs || 0,
        panLbs: sc.stairPansTotalWeight || 0,
        scrapLbs: sc.scrapLbs || 0,
        // Costs
        steelCost: sc.steelPriceBase || 0,
        pansCost: sc.stairPansTotalPrice || 0,
        gratingCost: sc.gratingTotalCost || 0,
        finishCost: sc.finishTotalCost || 0,
        scrapCost: sc.scrapPriceOnly || 0,
        porRokCost: sc.porRokCost || 0,
        anchorBoltsCost: sc.anchorBoltsCost || 0,
        // Labor
        shopMHPerLF: sc.shopMH || 0,
        fieldMHPerLF: sc.fieldMH || 0,
        galvShopMHPerLF: sc.galvShopMH || 0,
        galvFieldMHPerLF: sc.galvFieldMH || 0,
        shopHrsTotal: sc.shopTotalHrs || 0,
        fieldHrsTotal: sc.fieldTotalHrs || 0,
        shopLaborCost: sc.shopLaborPrice || 0,
        fieldLaborCost: sc.fieldLaborPrice || 0,
        // Totals
        subTotalMaterial: sc.subTotalMaterial || 0,
        subTotalWithoutTax: sc.subTotalWithoutTax || 0,
        taxAmount: sc.taxTotal || 0,
        total: sc.total || (sc.subTotalWithoutTax || 0) + (sc.taxTotal || 0),
        pricePerRiser: (sc.risers && sc.risers > 0)
          ? ((sc.subTotalWithoutTax || 0) + (sc.taxTotal || 0)) / sc.risers
          : 0,
        finish: stair.finish || '—',
        mountingType: stair.connectionType || stair.mountingType || '—',
      });
      totalRisers += sc.risers || stair.risers || 0;

      // Rails attached to this stair
      (stair.rails || []).forEach((rail, ri) => {
        const rs = rail.systemCalc || {};
        allRails.push({
          index: allRails.length + 1,
          stairRef: `Stair ${si + 1}`,
          label: rail.railType || rail.type || `Rail ${ri + 1}`,
          typeCode: rail.typeCode || '—',
          mountingType: rs.mountingType || rail.mountingType || rail.config?.mountingType || '—',
          postSpacing: rs.actualSpacing || rail.postSpacing || '—',
          length: rs.lengthFt || rail.railLength || rail.length || 0,
          finish: rail.finish || '—',
          weight: rs.totalSteel || rail.baseWeight || 0,
          steelLbsPerLF: rs.steelLbsPerLF || 0,
          scrapLbs: rs.scrapLbs || 0,
          postQty: rs.posts || rail.postQty || 0,
          bracketQty: rs.bracketQty || rail.bracketQty || 0,
          // Costs
          steelCost: rs.steelPriceBase || 0,
          scrapCost: rs.scrapPriceOnly || 0,
          finishCost: rs.finishTotalCost || 0,
          porRokCost: rs.porRokCost || 0,
          anchorBoltsCost: rs.anchorBoltsCost || 0,
          // Labor
          shopMHPerLF: rs.shopMH || 0,
          fieldMHPerLF: rs.fieldMH || 0,
          shopHrsTotal: rs.shopTotalHrs || 0,
          fieldHrsTotal: rs.fieldTotalHrs || 0,
          shopLaborCost: rs.shopLaborPrice || 0,
          fieldLaborCost: rs.fieldLaborPrice || 0,
          // Totals
          subTotalMaterial: rs.subTotalMaterial || 0,
          subTotalWithoutTax: rs.subTotalWithoutTax || 0,
          taxAmount: rs.taxTotal || 0,
          total: (rs.subTotalWithoutTax || 0) + (rs.taxTotal || 0),
        });
      });

      // Platforms (landings) attached to this stair
      (stair.platforms || stair.landings || []).forEach((plat, pi) => {
        const ps = plat.systemCalc || {};
        allPlatforms.push({
          index: allPlatforms.length + 1,
          stairRef: `Stair ${si + 1}`,
          label: plat.platformType || plat.type || `Platform ${pi + 1}`,
          length: plat.length || 0,
          width: plat.width || 0,
          area: ps.area || (parseFloat(plat.length) * parseFloat(plat.width)) || 0,
          finish: plat.finish || '—',
          steelLbsPerSF: ps.steelLbsPerLF || 0,
          steelLbsTotal: ps.totalSteel || 0,
          scrapLbs: ps.scrapLbs || 0,
          steelCost: ps.steelPriceBase || 0,
          scrapCost: ps.scrapPriceOnly || 0,
          finishCost: ps.finishTotalCost || 0,
          mountingCost: (ps.porRokCost || 0) + (ps.anchorBoltsCost || 0),
          shopMHPerSF: ps.shopMH || 0,
          fieldMHPerSF: ps.fieldMH || 0,
          shopHrsTotal: ps.shopTotalHrs || 0,
          fieldHrsTotal: ps.fieldTotalHrs || 0,
          shopLaborCost: ps.shopLaborPrice || 0,
          fieldLaborCost: ps.fieldLaborPrice || 0,
          subTotalMaterial: ps.subTotalMaterial || 0,
          subTotalWithoutTax: ps.subTotalWithoutTax || 0,
          taxAmount: ps.taxTotal || 0,
          total: (ps.subTotalWithoutTax || 0) + (ps.taxTotal || 0),
        });
      });
    });

    // ── Summary aggregation from saved estimation result ───────────────────
    const er = project.estimationResult || {};
    const summarySource = er.summary || er.standardSummary || {};

    const grandTotal = summarySource.grandTotal || 0;
    const pricePerRiser = totalRisers > 0 ? grandTotal / totalRisers : 0;

    const summary = {
      stairSteelLbs: allStairs.reduce((s, st) => s + st.stringerLbs, 0),
      railSteelLbs:  allRails.reduce((s, r) => s + r.weight, 0),
      platSteelLbs:  allPlatforms.reduce((s, p) => s + p.steelLbsTotal, 0),
      totalSteelLbs: summarySource.totalSteelWeight || 0,
      totalScrapLbs: summarySource.scrapWeight || 0,
      baseSteelCost: summarySource.baseSteelCost || 0,
      scrapCost:     summarySource.scrapWeightCost || 0,
      pansCost:      summarySource.pansMaterialPrice || 0,
      gratingCost:   summarySource.gratingTotalCost || 0,
      finishCost:    summarySource.galvanizeCost || 0,
      shopLaborCost: summarySource.shopLaborCost || 0,
      fieldLaborCost:summarySource.fieldLaborCost || 0,
      shopHrsTotal:  summarySource.totalShopHours || 0,
      fieldHrsTotal: summarySource.totalFieldHours || 0,
      anchorBoltsCost:summarySource.anchorBoltsCost || 0,
      porRokCost:    summarySource.porRokAnchorsCost || 0,
      subtotalWithoutTax: summarySource.subtotalWithoutTax || 0,
      taxAmount:     summarySource.taxAmount || 0,
      grandTotal,
      totalRisers,
      pricePerRiser: summarySource.pricePerRiser || pricePerRiser,
      // Per-module totals
      stairTotal:    allStairs.reduce((s, st) => s + st.total, 0),
      railTotal:     allRails.reduce((s, r) => s + r.total, 0),
      platTotal:     allPlatforms.reduce((s, p) => s + p.total, 0),
    };

    res.json({
      success: true,
      project: {
        id: project.id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        customerName: project.linkedCustomerName || project.customer_name || '—',
        projectLocation: project.project_location || '—',
        architect: project.architect || '—',
        eor: project.eor || '—',
        gcName: project.gc_name || '—',
        detailer: project.detailer || '—',
        vendorName: project.vendor_name || '—',
        assignedEngineer: project.assignedEngineer || '—',
        enquiryDate: project.enquiryDate,
        submissionDeadline: project.submissionDeadline,
        aiscCertified: project.aisc_certified || 'Yes',
        units: project.units || 'Imperial',
        notes: project.notes || '',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      rates,
      summary,
      stairs: allStairs,
      rails: allRails,
      platforms: allPlatforms,
    });
  } catch (err) {
    logger.error('reportRoutes /live error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/reports/:projectId/bom-excel ────────────────────────────────────
// Generates and streams a 4-sheet ExcelJS workbook.
router.get('/:projectId/bom-excel', async (req, res) => {
  try {
    // Re-use live data
    const liveRes = await fetchLiveData(req.params.projectId, req.userId);
    if (!liveRes.success) return res.status(404).json(liveRes);

    const { project, rates, summary, stairs, rails, platforms } = liveRes;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MISC Engineering Platform';
    workbook.created = new Date();

    // ── Styling helpers ──────────────────────────────────────────────────────
    const ACCENT   = '10a37f';
    const DARK     = '1a1a2e';
    const MED_GRAY = 'f0f0f0';
    const LIGHT_BG = 'fafafa';
    const BLUE_HDR = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ACCENT}` } };
    const GRAY_HDR = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
    const DARK_HDR = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } };
    const ALT_ROW  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FFF9' } };

    const hdrFont  = (clr = 'FFFFFFFF') => ({ bold: true, color: { argb: clr }, size: 9, name: 'Calibri' });
    const bodyFont = () => ({ size: 9, name: 'Calibri' });
    const boldFont = () => ({ bold: true, size: 9, name: 'Calibri' });
    const border   = () => ({
      top:    { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left:   { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right:  { style: 'thin', color: { argb: 'FFD0D0D0' } },
    });

    const numFmt  = '#,##0.000';
    const dolFmt  = '"$"#,##0.00';
    const pctFmt  = '0.0%';
    const intFmt  = '#,##0';

    // ── Sheet 1: Final Estimate ──────────────────────────────────────────────
    const s1 = workbook.addWorksheet('Final Estimate');
    s1.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

    // Header block (rows 1-3)
    s1.mergeCells('A1:H1');
    const titleCell = s1.getCell('A1');
    titleCell.value = 'MISC ENGINEERING — STRUCTURAL ESTIMATE REPORT';
    titleCell.font = { bold: true, size: 14, color: { argb: DARK_HDR.fgColor.argb }, name: 'Calibri' };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    s1.getRow(1).height = 28;

    const metaRows = [
      ['Project', `${project.projectNumber} — ${project.projectName}`, 'Customer', project.customerName],
      ['Location', project.projectLocation, 'Architect / EOR / GC', `${project.architect} / ${project.eor} / ${project.gcName}`],
      ['Engineer', project.assignedEngineer, 'AISC Certified', project.aiscCertified],
      ['Enquiry', project.enquiryDate ? new Date(project.enquiryDate).toLocaleDateString() : '—',
       'Deadline',  project.submissionDeadline ? new Date(project.submissionDeadline).toLocaleDateString() : '—'],
      ['Generated', new Date().toLocaleDateString(), 'Units', project.units],
    ];
    metaRows.forEach((row, i) => {
      const r = s1.addRow(row);
      [1, 3].forEach(ci => {
        r.getCell(ci).font = boldFont();
        r.getCell(ci).fill = GRAY_HDR;
      });
      r.getCell(2).font = bodyFont();
      r.getCell(4).font = bodyFont();
    });

    s1.addRow([]);

    // Rates row
    const rHdr = s1.addRow(['RATES USED AT TIME OF ESTIMATE']);
    rHdr.getCell(1).font = { bold: true, size: 10, color: { argb: `FF${ACCENT}` } };
    s1.mergeCells(`A${rHdr.number}:H${rHdr.number}`);

    const rateLabels = s1.addRow([
      'Steel $/lb', 'Shop $/hr', 'Field $/hr', 'Galvanize $/lb',
      'Powder Coat $/lb', 'Scrap %', 'Tax %', 'Anchor Bolt Rate',
      'Embedded Rate', 'Anchored Rate'
    ]);
    rateLabels.eachCell(c => { c.font = hdrFont('FF000000'); c.fill = GRAY_HDR; c.border = border(); });
    const rateVals = s1.addRow([
      rates.steelPerLb, rates.shopPerHr, rates.fieldPerHr, rates.galvanizePerLb,
      rates.powderCoatPerLb, rates.scrapPct / 100, rates.taxPct / 100,
      rates.anchorBoltRate, rates.embeddedRate, rates.anchoredRate,
    ]);
    rateVals.getCell(1).numFmt = dolFmt;
    rateVals.getCell(2).numFmt = dolFmt;
    rateVals.getCell(3).numFmt = dolFmt;
    rateVals.getCell(4).numFmt = dolFmt;
    rateVals.getCell(5).numFmt = dolFmt;
    rateVals.getCell(6).numFmt = pctFmt;
    rateVals.getCell(7).numFmt = pctFmt;
    rateVals.getCell(8).numFmt = dolFmt;
    rateVals.getCell(9).numFmt = dolFmt;
    rateVals.getCell(10).numFmt = dolFmt;
    rateVals.eachCell(c => { c.font = bodyFont(); c.border = border(); });

    s1.addRow([]);

    // Summary table
    const sHdr = s1.addRow(['PROJECT SUMMARY']);
    sHdr.getCell(1).font = { bold: true, size: 10, color: { argb: `FF${ACCENT}` } };

    const sumHeaders = s1.addRow(['Line Item', 'Stair', 'Rail', 'Platform', 'Total']);
    sumHeaders.eachCell(c => {
      c.font = hdrFont();
      c.fill = BLUE_HDR;
      c.border = border();
    });

    const sumData = [
      ['Steel lbs (base)',       summary.stairSteelLbs,  summary.railSteelLbs,  summary.platSteelLbs,  summary.stairSteelLbs+summary.railSteelLbs+summary.platSteelLbs],
      ['Scrap lbs',              '—', '—', '—',          summary.totalScrapLbs],
      ['Steel cost',             '—', '—', '—',          summary.baseSteelCost],
      ['Scrap cost',             '—', '—', '—',          summary.scrapCost],
      ['Pans / Grating cost',    summary.pansCost + summary.gratingCost, '—', '—', summary.pansCost + summary.gratingCost],
      ['Finish cost',            '—', '—', '—',          summary.finishCost],
      ['POR ROK cost',           '—', '—', '—',          summary.porRokCost],
      ['Anchor bolts cost',      '—', '—', '—',          summary.anchorBoltsCost],
      ['Shop labor cost',        '—', '—', '—',          summary.shopLaborCost],
      ['Field labor cost',       '—', '—', '—',          summary.fieldLaborCost],
      ['Sub-module total',       summary.stairTotal,     summary.railTotal,     summary.platTotal,     summary.stairTotal+summary.railTotal+summary.platTotal],
      ['Sub-total w/o tax',      '—', '—', '—',          summary.subtotalWithoutTax],
      ['Tax',                    '—', '—', '—',          summary.taxAmount],
      ['GRAND TOTAL',            '—', '—', '—',          summary.grandTotal],
    ];

    if (project.additionalCosts && project.additionalCosts.total !== undefined) {
      sumData.push(['TOTAL W/ ADJUSTMENTS', '—', '—', '—', project.additionalCosts.total]);
    }

    sumData.push(
      ['Total Risers',           summary.totalRisers, '—', '—', summary.totalRisers],
      ['Price / Riser',          '—', '—', '—',          summary.pricePerRiser]
    );

    sumData.forEach((row, i) => {
      const r = s1.addRow(row);
      r.eachCell(c => { c.font = bodyFont(); c.border = border(); });
      r.getCell(1).font = boldFont();
      if (i % 2 === 0) r.eachCell(c => { c.fill = ALT_ROW; });
      // Dollar format for cost cells
      [2,3,4,5].forEach(ci => {
        const val = r.getCell(ci).value;
        if (typeof val === 'number') r.getCell(ci).numFmt = ['Steel lbs','Scrap lbs','Total Risers'].some(l => row[0].includes(l)) ? numFmt : dolFmt;
      });
      // Bold Grand Total and Adjustments
      if (row[0] === 'GRAND TOTAL' || row[0] === 'TOTAL W/ ADJUSTMENTS') {
        r.eachCell(c => { c.font = { ...boldFont(), color: { argb: `FF${ACCENT}` } }; });
      }
    });

    s1.columns = [
      { key:'a', width: 24 }, { key:'b', width: 14 }, { key:'c', width: 14 },
      { key:'d', width: 14 }, { key:'e', width: 14 }, { key:'f', width: 12 },
      { key:'g', width: 12 }, { key:'h', width: 12 }, { key:'i', width: 12 }, { key:'j', width: 12 },
    ];

    // ── Sheet 2: Stair Detail ────────────────────────────────────────────────
    const s2 = workbook.addWorksheet('Stair Detail');
    s2.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

    const s2Cols = [
      'Stair', 'Category', 'Type', 'Width', 'Risers', 'Run', 'Rise', 'Angle',
      'Connection', 'Stringer Size', 'Stringer LF', 'Pan Area (sqft)',
      'Steel lbs/LF', 'Stringer lbs', 'Pan lbs', 'Scrap lbs',
      'Steel Cost', 'Pans Cost', 'Grating Cost', 'Finish Cost', 'Scrap Cost',
      'POR ROK', 'Anchor Bolts', 'Sub-Total Material',
      'Shop MH/LF', 'Field MH/LF', 'Shop Hrs', 'Field Hrs', 'Shop Labor $', 'Field Labor $',
      'Sub-Total w/o Tax', 'Tax', 'Total', 'Price/Riser',
    ];

    const s2Hdr = s2.addRow(s2Cols);
    s2Hdr.eachCell(c => {
      c.font = hdrFont();
      c.fill = BLUE_HDR;
      c.border = border();
      c.alignment = { horizontal: 'center', wrapText: true };
    });
    s2.getRow(1).height = 36;

    stairs.forEach((st, i) => {
      const r = s2.addRow([
        st.label, st.category, st.stairType, st.width,
        st.risers, st.run, st.rise, fmt(st.angle),
        st.connection, st.stringerSize,
        st.stringerLFTotal, st.panAreaSqFt,
        st.steelLbsPerLF, st.stringerLbs, st.panLbs, st.scrapLbs,
        st.steelCost, st.pansCost, st.gratingCost, st.finishCost, st.scrapCost,
        st.porRokCost, st.anchorBoltsCost, st.subTotalMaterial,
        st.shopMHPerLF, st.fieldMHPerLF, st.shopHrsTotal, st.fieldHrsTotal,
        st.shopLaborCost, st.fieldLaborCost,
        st.subTotalWithoutTax, st.taxAmount, st.total, st.pricePerRiser,
      ]);
      if (i % 2 === 0) r.eachCell(c => { c.fill = ALT_ROW; });
      r.eachCell(c => { c.font = bodyFont(); c.border = border(); });
      // Apply formats
      [11,12,13,14,15,16].forEach(ci => r.getCell(ci).numFmt = numFmt);
      [17,18,19,20,21,22,23,24,29,30,31,32,33,34].forEach(ci => r.getCell(ci).numFmt = dolFmt);
      [25,26,27,28].forEach(ci => r.getCell(ci).numFmt = numFmt);
      r.getCell(5).numFmt = intFmt; // risers
    });

    s2Cols.forEach((_, i) => { s2.getColumn(i + 1).width = i < 4 ? 18 : 13; });
    s2.getColumn(1).width = 16;
    s2.getColumn(10).width = 20;

    // ── Sheet 3: Rail Detail ─────────────────────────────────────────────────
    const s3 = workbook.addWorksheet('Rail Detail');
    s3.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

    const s3Cols = [
      'Rail #', 'Stair Ref', 'Rail Type', 'Type Code', 'Mounting Type',
      'Post Spacing (ft)', 'Length (ft)', 'Finish', 'Posts', 'Brackets',
      'Steel lbs/LF', 'Steel lbs Total', 'Scrap lbs',
      'Steel Cost', 'Scrap Cost', 'Finish Cost', 'POR ROK', 'Anchor Bolts', 'Sub-Total Material',
      'Shop MH/LF', 'Field MH/LF', 'Shop Hrs', 'Field Hrs', 'Shop Labor $', 'Field Labor $',
      'Sub-Total w/o Tax', 'Tax', 'Total',
    ];

    const s3Hdr = s3.addRow(s3Cols);
    s3Hdr.eachCell(c => {
      c.font = hdrFont();
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      c.border = border();
      c.alignment = { horizontal: 'center', wrapText: true };
    });
    s3.getRow(1).height = 36;

    rails.forEach((r, i) => {
      const row = s3.addRow([
        r.index, r.stairRef, r.label, r.typeCode, r.mountingType,
        r.postSpacing, r.length, r.finish, r.postQty, r.bracketQty,
        r.steelLbsPerLF, r.weight, r.scrapLbs,
        r.steelCost, r.scrapCost, r.finishCost, r.porRokCost, r.anchorBoltsCost, r.subTotalMaterial,
        r.shopMHPerLF, r.fieldMHPerLF, r.shopHrsTotal, r.fieldHrsTotal, r.shopLaborCost, r.fieldLaborCost,
        r.subTotalWithoutTax, r.taxAmount, r.total,
      ]);
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } }; });
      row.eachCell(c => { c.font = bodyFont(); c.border = border(); });
      [11,12,13].forEach(ci => row.getCell(ci).numFmt = numFmt);
      [14,15,16,17,18,19,24,25,26,27,28].forEach(ci => row.getCell(ci).numFmt = dolFmt);
      [20,21,22,23].forEach(ci => row.getCell(ci).numFmt = numFmt);
    });

    s3Cols.forEach((_, i) => { s3.getColumn(i + 1).width = i < 3 ? 20 : 13; });

    // ── Sheet 4: Platform / Landing Detail ───────────────────────────────────
    const s4 = workbook.addWorksheet('Platform Detail');
    s4.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 };

    const s4Cols = [
      'Plat #', 'Stair Ref', 'Type', 'Length (ft)', 'Width (ft)', 'Area (sqft)', 'Finish',
      'Steel lbs/SF', 'Steel lbs Total', 'Scrap lbs',
      'Steel Cost', 'Scrap Cost', 'Finish Cost', 'Mounting Cost', 'Sub-Total Material',
      'Shop MH/SF', 'Field MH/SF', 'Shop Hrs', 'Field Hrs', 'Shop Labor $', 'Field Labor $',
      'Sub-Total w/o Tax', 'Tax', 'Total',
    ];

    const s4Hdr = s4.addRow(s4Cols);
    s4Hdr.eachCell(c => {
      c.font = hdrFont();
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
      c.border = border();
      c.alignment = { horizontal: 'center', wrapText: true };
    });
    s4.getRow(1).height = 36;

    if (platforms.length === 0) {
      const nr = s4.addRow(['No platforms configured for this project.']);
      s4.mergeCells(`A${nr.number}:X${nr.number}`);
      nr.getCell(1).font = bodyFont();
    }

    platforms.forEach((p, i) => {
      const row = s4.addRow([
        p.index, p.stairRef, p.label, p.length, p.width, p.area, p.finish,
        p.steelLbsPerSF, p.steelLbsTotal, p.scrapLbs,
        p.steelCost, p.scrapCost, p.finishCost, p.mountingCost, p.subTotalMaterial,
        p.shopMHPerSF, p.fieldMHPerSF, p.shopHrsTotal, p.fieldHrsTotal, p.shopLaborCost, p.fieldLaborCost,
        p.subTotalWithoutTax, p.taxAmount, p.total,
      ]);
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8ED' } }; });
      row.eachCell(c => { c.font = bodyFont(); c.border = border(); });
      [6,8,9,10].forEach(ci => row.getCell(ci).numFmt = numFmt);
      [11,12,13,14,15,20,21,22,23,24].forEach(ci => row.getCell(ci).numFmt = dolFmt);
      [16,17,18,19].forEach(ci => row.getCell(ci).numFmt = numFmt);
    });

    s4Cols.forEach((_, i) => { s4.getColumn(i + 1).width = i < 3 ? 18 : 13; });

    // ── Stream response ──────────────────────────────────────────────────────
    const filename = `BOM_${project.projectNumber}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    logger.error('reportRoutes /bom-excel error', { error: err.message, stack: err.stack });
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// ─── Internal helper: fetch live data (used by bom-excel internally) ──────────
async function fetchLiveData(projectId, userId) {
  await configManager.loadConfigs();

  const [rows] = await db.query(`
    SELECT p.*, c.companyName as linkedCustomerName
    FROM projects p
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE p.id = ? AND p.userId = ?
  `, [projectId, userId]);

  const project = rows[0];
  if (!project) return { success: false };

  const parsedStairs = tryParse(project.stairs);
  project.stairs = Array.isArray(parsedStairs) ? parsedStairs : [];
  project.estimationResult = tryParse(project.estimationResult);

  const rates = {
    steelPerLb:      configManager.get('steel_price_per_lb', 0.75),
    shopPerHr:       configManager.get('shop_hourly_rate', 70),
    fieldPerHr:      configManager.get('field_hourly_rate', 70),
    galvanizePerLb:  configManager.get('galvanize_rate', 0.75),
    powderCoatPerLb: configManager.get('powder_coat_rate', 1.7587),
    scrapPct:        configManager.get('scrap_factor_pct', 10),
    taxPct:          configManager.get('tax_rate', 0.06) * 100,
    anchorBoltRate:  configManager.get('anchor_bolt_rate', 0.025),
    embeddedRate:    configManager.get('mounting_embedded_rate', 5.00),
    anchoredRate:    configManager.get('mounting_anchored_rate', 6.00),
  };

  const allStairs = [];
  const allRails = [];
  const allPlatforms = [];
  let totalRisers = 0;

    (project.stairs || []).forEach((stair, si) => {
      // Stair-level systemCalc
      const sc = stair.systemCalc || {};
      allStairs.push({
        index: si + 1,
        label: stair.stairName || stair.label || `Stair ${si + 1}`,
        stairType: flatVal(stair.stairType),
        category: flatVal(stair.category || stair.stairCategory),
        width: flatVal(stair.stairWidth || stair.width),
        risers: sc.risers || stair.risers || 0,
        run: flatVal(stair.run),
        rise: flatVal(stair.rise),
        connection: flatVal(stair.connectionType || stair.mountingType),
        stringerSize: flatVal(stair.stringerSize),
        angle: flatVal(stair.slope || sc.angle),
        // BOM fields
        steelLbsPerLF: sc.stringerLbsPerFt || sc.steelLbsPerLF || 0,
        stringerLFTotal: sc.totalLFBothStringers || 0,
        panAreaSqFt: sc.panArea || 0,
        // Weights
        stringerLbs: sc.totalSteel || sc.baseSteelLbs || 0,
        panLbs: sc.stairPansTotalWeight || 0,
        scrapLbs: sc.scrapLbs || 0,
        // Costs
        steelCost: sc.steelPriceBase || 0,
        pansCost: sc.stairPansTotalPrice || 0,
        gratingCost: sc.gratingTotalCost || 0,
        finishCost: sc.finishTotalCost || 0,
        scrapCost: sc.scrapPriceOnly || 0,
        porRokCost: sc.porRokCost || 0,
        anchorBoltsCost: sc.anchorBoltsCost || 0,
        // Labor
        shopMHPerLF: sc.shopMH || 0,
        fieldMHPerLF: sc.fieldMH || 0,
        galvShopMHPerLF: sc.galvShopMH || 0,
        galvFieldMHPerLF: sc.galvFieldMH || 0,
        shopHrsTotal: sc.shopTotalHrs || 0,
        fieldHrsTotal: sc.fieldTotalHrs || 0,
        shopLaborCost: sc.shopLaborPrice || 0,
        fieldLaborCost: sc.fieldLaborPrice || 0,
        // Totals
        subTotalMaterial: sc.subTotalMaterial || 0,
        subTotalWithoutTax: sc.subTotalWithoutTax || 0,
        taxAmount: sc.taxTotal || 0,
        total: sc.total || (sc.subTotalWithoutTax || 0) + (sc.taxTotal || 0),
        pricePerRiser: (sc.risers && sc.risers > 0)
          ? ((sc.subTotalWithoutTax || 0) + (sc.taxTotal || 0)) / sc.risers
          : 0,
        finish: stair.finish || '—',
        mountingType: stair.connectionType || stair.mountingType || '—',
      });
      totalRisers += sc.risers || stair.risers || 0;

      // Rails attached to this stair
      (stair.rails || []).forEach((rail, ri) => {
        const rs = rail.systemCalc || {};
        allRails.push({
          index: allRails.length + 1,
          stairRef: stair.stairName || stair.label || `Stair ${si + 1}`,
          label: rail.railType || rail.type || `Rail ${ri + 1}`,
          typeCode: rail.typeCode || '—',
          mountingType: flatVal(rs.mountingType || rail.mountingType || rail.config?.mountingType),
          postSpacing: flatNum(rs.actualSpacing || rail.postSpacing || 0),
          length: flatNum(rs.lengthFt || rail.railLength || rail.length || 0),
          finish: rail.finish || '—',
          weight: rs.totalSteel || rail.baseWeight || 0,
          steelLbsPerLF: rs.steelLbsPerLF || 0,
          scrapLbs: rs.scrapLbs || 0,
          postQty: rs.posts || rail.postQty || 0,
          bracketQty: rs.bracketQty || rail.bracketQty || 0,
          // Costs
          steelCost: rs.steelPriceBase || 0,
          scrapCost: rs.scrapPriceOnly || 0,
          finishCost: rs.finishTotalCost || 0,
          porRokCost: rs.porRokCost || 0,
          anchorBoltsCost: rs.anchorBoltsCost || 0,
          // Labor
          shopMHPerLF: rs.shopMH || 0,
          fieldMHPerLF: rs.fieldMH || 0,
          shopHrsTotal: rs.shopTotalHrs || 0,
          fieldHrsTotal: rs.fieldTotalHrs || 0,
          shopLaborCost: rs.shopLaborPrice || 0,
          fieldLaborCost: rs.fieldLaborPrice || 0,
          // Totals
          subTotalMaterial: rs.subTotalMaterial || 0,
          subTotalWithoutTax: rs.subTotalWithoutTax || 0,
          taxAmount: rs.taxTotal || 0,
          total: (rs.subTotalWithoutTax || 0) + (rs.taxTotal || 0),
        });
      });

      // Platforms (landings) attached to this stair
      (stair.platforms || stair.landings || []).forEach((plat, pi) => {
        const ps = plat.systemCalc || {};
        allPlatforms.push({
          index: allPlatforms.length + 1,
          stairRef: stair.stairName || stair.label || `Stair ${si + 1}`,
          label: plat.platformType || plat.type || `Platform ${pi + 1}`,
          length: flatNum(plat.length || 0),
          width: flatNum(plat.width || 0),
          area: ps.area || (flatNum(plat.length) * flatNum(plat.width)) || 0,
          finish: plat.finish || '—',
          steelLbsPerSF: ps.steelLbsPerLF || 0,
          steelLbsTotal: ps.totalSteel || 0,
          scrapLbs: ps.scrapLbs || 0,
          steelCost: ps.steelPriceBase || 0,
          scrapCost: ps.scrapPriceOnly || 0,
          finishCost: ps.finishTotalCost || 0,
          mountingCost: (ps.porRokCost || 0) + (ps.anchorBoltsCost || 0),
          shopMHPerSF: ps.shopMH || 0,
          fieldMHPerSF: ps.fieldMH || 0,
          shopHrsTotal: ps.shopTotalHrs || 0,
          fieldHrsTotal: ps.fieldTotalHrs || 0,
          shopLaborCost: ps.shopLaborPrice || 0,
          fieldLaborCost: ps.fieldLaborPrice || 0,
          subTotalMaterial: ps.subTotalMaterial || 0,
          subTotalWithoutTax: ps.subTotalWithoutTax || 0,
          taxAmount: ps.taxTotal || 0,
          total: (ps.subTotalWithoutTax || 0) + (ps.taxTotal || 0),
        });
      });
    });

    const er = project.estimationResult || {};
    const summarySource = er.summary || er.standardSummary || {};
    const grandTotal = summarySource.grandTotal || 0;

    const summary = {
      stairSteelLbs: allStairs.reduce((s, st) => s + st.stringerLbs, 0),
      railSteelLbs:  allRails.reduce((s, r) => s + r.weight, 0),
      platSteelLbs:  allPlatforms.reduce((s, p) => s + p.steelLbsTotal, 0),
      totalSteelLbs: summarySource.totalSteelWeight || 0,
      totalScrapLbs: summarySource.scrapWeight || 0,
      baseSteelCost: summarySource.baseSteelCost || 0,
      scrapCost:     summarySource.scrapWeightCost || 0,
      pansCost:      summarySource.pansMaterialPrice || 0,
      gratingCost:   summarySource.gratingTotalCost || 0,
      finishCost:    summarySource.galvanizeCost || 0,
      shopLaborCost: summarySource.shopLaborCost || 0,
      fieldLaborCost:summarySource.fieldLaborCost || 0,
      shopHrsTotal:  summarySource.totalShopHours || 0,
      fieldHrsTotal: summarySource.totalFieldHours || 0,
      anchorBoltsCost:summarySource.anchorBoltsCost || 0,
      porRokCost:    summarySource.porRokAnchorsCost || 0,
      subtotalWithoutTax: summarySource.subtotalWithoutTax || 0,
      taxAmount:     summarySource.taxAmount || 0,
      grandTotal,
      totalRisers,
      pricePerRiser: summarySource.pricePerRiser || (totalRisers > 0 ? grandTotal / totalRisers : 0),
      stairTotal:    allStairs.reduce((s, st) => s + st.total, 0),
      railTotal:     allRails.reduce((s, r) => s + r.total, 0),
      platTotal:     allPlatforms.reduce((s, p) => s + p.total, 0),
    };

    return {
      success: true,
      project: {
        id: project.id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        customerName: project.linkedCustomerName || project.customer_name || '—',
        projectLocation: project.project_location || '—',
        architect: project.architect || '—',
        eor: project.eor || '—',
        gcName: project.gc_name || '—',
        detailer: project.detailer || '—',
        vendorName: project.vendor_name || '—',
        assignedEngineer: project.assignedEngineer || '—',
        enquiryDate: project.enquiryDate,
        submissionDeadline: project.submissionDeadline,
        aiscCertified: project.aisc_certified || 'Yes',
        units: project.units || 'Imperial',
        notes: project.notes || '',
        additionalCosts: tryParse(project.additionalCosts) || null,
      },
      rates, summary, stairs: allStairs, rails: allRails, platforms: allPlatforms,
    };
}

module.exports = router;
