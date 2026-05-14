import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Surface Area Calculations for Finishing (Galvanizing/Primer)
 */
const calculateSurfaceArea = (stair) => {
  const slopeFt = parseFloat(stair.slope || 0) / 12;
  const numRisers = parseInt(stair.numRisers || 0);
  const totalSlopePerSide = slopeFt * numRisers;
  const perimeter = stair.stringerSize?.includes('C12') ? 32 : 24; 
  const stringerArea = (totalSlopePerSide * 2 * (perimeter / 12)) * 1.1; 
  const panArea = parseFloat(stair.calcPanArea || 0);
  const totalArea = stringerArea + (panArea * 2.2);
  return totalArea;
};

/**
 * Professional PDF Proposal Generator
 */
export const generateProposalPDF = (projectData, stairs, estimationResult = null, returnBlob = false) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleDateString();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATION PROPOSAL', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DATE: ${timestamp}`, 160, 15);
  doc.text(`PROJECT ID: EST-${Date.now().toString().slice(-6)}`, 160, 22);
  doc.text('VANTAGE ENGINEERING STANDARDS', 160, 29);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(`PROJECT: ${projectData.projectName || 'Unnamed Project'}`, 15, 55);
  doc.text(`NUMBER: ${projectData.projectNumber || 'N/A'}`, 15, 62);
  doc.setLineWidth(0.5);
  doc.line(15, 66, 195, 66);

  let currentY = 75;

  const stairsArr = Array.isArray(stairs) ? stairs : [];
  stairsArr.forEach((stair, idx) => {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`SECTION ${idx + 1}: ${stair.label.toUpperCase()}`, 15, currentY);
    currentY += 8;

    const tableData = [
      ['GEOMETRY', 'MATERIAL / SPEC', 'QTY / DIM', 'WEIGHT (lb)'],
      ['Run/Rise', 'Engineering Std', `${stair.run?.value || 0}" / ${stair.rise?.value || 0}"`, '—'],
      ['Angle', 'Compliance Check', `${stair.angle || 0} deg`, '—'],
      ['Stringers', stair.stringerSize || 'N/A', `${stair.calcStringerLF || 0} LF`, `${stair.calcStringerWeight || 0}`],
      ['Tread Pans', stair.panPlThk?.value || (typeof stair.panPlThk === 'string' ? stair.panPlThk : '0.1046'), `${stair.calcPanArea || 0} SQFT`, `${stair.calcPanSteelWeight || 0}`],
      ['Concrete', '3000 PSI Fill', `${stair.calcConcreteCY || 0} CY`, '—']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: 15, right: 15 }
    });

    currentY = doc.lastAutoTable.finalY + 15;
  });

  const structWeight = stairsArr.reduce((sum, s) => sum + parseFloat(s.calcStringerWeight || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ESTIMATION SUMMARY', 15, currentY + 10);
  const finishArea = stairsArr.reduce((sum, s) => sum + calculateSurfaceArea(s), 0);
  
  const additionalCosts = typeof projectData?.additionalCosts === 'string' ? JSON.parse(projectData.additionalCosts) : (projectData?.additionalCosts || null);
  const parsedEst = estimationResult || (typeof projectData?.estimationResult === 'string' ? JSON.parse(projectData.estimationResult) : (projectData?.estimationResult || null));
  const res = parsedEst?.sfeSummary || parsedEst?.summary || {};
  const panPlateWeight = parseFloat(res.panPlateWeight || stairsArr.reduce((sum, s) => sum + parseFloat(s.calcPanSteelWeight || 0), 0));

  const summaryBody = [
    ['TOTAL STRUCTURAL STEEL WEIGHT (w/ 11% Scrap)', `${structWeight.toFixed(2)} lbs`],
    ['TOTAL PAN PLATE WEIGHT', `${panPlateWeight.toFixed(2)} lbs`],
    ['FINISHING SURFACE AREA (for Galv)', `${finishArea.toFixed(2)} SQFT`],
    ['TOTAL FABRICATION HOURS', '— Hrs'],
    ['TOTAL ESTIMATED COST', '— USD']
  ];

  if (parsedEst) {
    if (res.totalShopHours !== undefined && res.totalFieldHours !== undefined) {
      summaryBody[3] = ['TOTAL FABRICATION HOURS', `${(parseFloat(res.totalShopHours) + parseFloat(res.totalFieldHours)).toFixed(2)} Hrs`];
    }
    if (res.grandTotal !== undefined) {
      summaryBody[4] = ['TOTAL ESTIMATED COST', `$${parseFloat(res.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`];
    }
  }

  if (additionalCosts && additionalCosts.total) {
    summaryBody.push(['TOTAL W/ ADJUSTMENTS (ADDITIONAL COSTS)', `$${parseFloat(additionalCosts.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
  }

  autoTable(doc, {
    startY: currentY + 15,
    body: summaryBody,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 5 }
  });

  if (returnBlob) {
    return doc.output('blob');
  }
  doc.save(`${projectData.projectName || 'Project'}_Proposal.pdf`);
};

/**
 * Fabrication BOM Excel Generator (ExcelJS implementation)
 * Updated to match EXACTLY the latest summary layout and calculation methodology 
 * identified from the user's Excel spreadsheet screenshot.
 */
export const generateFabricationExcel = async (projectData, stairs, estimationResult = null, returnBlob = false) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Final Estimate');

  // Columns Width
  worksheet.columns = [
    { width: 5 },  // A
    { width: 35 }, // B
    { width: 18 }, // C
    { width: 15 }, // D
    { width: 15 }, // E
    { width: 18 }, // F
    { width: 15 }, // G
    { width: 15 }, // H
    { width: 15 }, // I
  ];

  // Extraction of calculated summary data
  const res = estimationResult?.sfeSummary || estimationResult?.summary || {};
  const priceLb = res.steel_price_per_lb || 0.75;
  const panPlateWeight = res.totalPanPlateWeight || 0;
  const panPlateShopHrs = res.totalPanPlateShopHours || 0;
  const shopRate = res.shop_hourly_rate || 70;
  const fieldRate = res.field_hourly_rate || 70;
  const taxRate = res.tax_rate || 0.06;
  
  const steelWeight = res.baseSteelWeight || 0;
  const scrapWeight = res.scrapWeight || (steelWeight * 0.11);
  const shopHours = res.totalShopHours || 0;
  const fieldHours = res.totalFieldHours || 0;
  const galvShopHrs = res.totalGalvanizeShopHours || 0;
  const galvFieldHrs = res.totalGalvanizeFieldHours || 0;

  const steelPrice = res.baseSteelCost || (steelWeight * priceLb);
  const scrapPrice = res.scrapWeightCost || (scrapWeight * priceLb);
  const shopLabor = res.shopLaborCost || (shopHours * shopRate);
  const fieldLabor = res.fieldLaborCost || (fieldHours * fieldRate);

  const pansPrice = res.pansMaterialPrice || 0;
  const gratingPrice = res.gratingTotalCost || 0;
  const galvPrice = res.galvanizeCost || 0;
  const anchorsPrice = res.anchorBoltsCost || 0;
  const porRokPrice = res.porRokAnchorsCost || 0;
  const mountingCharges = res.mountingCharges || 0;

  // 🔄 PARITY FIX: Bind purely to backend totals to eliminate double counting logic natively 
  const totalMaterialPrice = steelPrice + pansPrice + gratingPrice + galvPrice + mountingCharges;
  const subtotalNoTax = res.subtotalWithoutTax || 0;
  const tax = res.taxAmount || 0;
  const totalEstimate = res.grandTotal || 0;

  // Header Title
  const titleRow = worksheet.getRow(2);
  titleRow.getCell(2).value = 'Miscellaneous Metal Final Estimate Form';
  titleRow.getCell(2).font = { size: 20, bold: true };
  titleRow.getCell(8).value = 'Rev. 02/06/15';
  titleRow.getCell(8).alignment = { horizontal: 'right' };

  // Project Info Table (Styling matching screenshot)
  const infoStartRow = 4;
  worksheet.getRow(infoStartRow).getCell(2).value = 'Project:';
  worksheet.getRow(infoStartRow).getCell(3).value = projectData.projectName || '0';
  worksheet.getRow(infoStartRow).getCell(3).font = { bold: true };
  worksheet.getRow(infoStartRow).getCell(3).border = { bottom: { style: 'thin' } };
  
  worksheet.getRow(infoStartRow).getCell(7).value = 'Date:';
  worksheet.getRow(infoStartRow).getCell(8).value = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  worksheet.getRow(infoStartRow).getCell(8).border = { 
    top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } 
  };
  worksheet.getRow(infoStartRow).getCell(8).font = { bold: true };
  worksheet.getRow(infoStartRow).getCell(8).alignment = { horizontal: 'center' };

  worksheet.getRow(infoStartRow+1).getCell(2).value = '';
  worksheet.getRow(infoStartRow+1).getCell(3).value = '0';
  worksheet.getRow(infoStartRow+1).getCell(3).border = { bottom: { style: 'thin' } };
  worksheet.getRow(infoStartRow+1).getCell(7).value = 'Notes:';
  worksheet.getRow(infoStartRow+1).getCell(8).border = { bottom: { style: 'thin' } };

  worksheet.getRow(infoStartRow+2).getCell(2).value = 'Project No.';
  worksheet.getRow(infoStartRow+2).getCell(3).value = projectData.projectNumber || '0';
  worksheet.getRow(infoStartRow+2).getCell(3).border = { bottom: { style: 'thin' } };

  // Main Summary Table
  const tableStart = 8;
  const headerRow = worksheet.getRow(tableStart);
  headerRow.getCell(3).value = 'Steel lbs';
  headerRow.getCell(4).value = 'Galvanize Shop Hours/ LF';
  headerRow.getCell(5).value = 'Galvanize Field Hours/ LF';
  headerRow.getCell(6).value = 'STEEL (+10% SCRAP) LBS';
  headerRow.getCell(7).value = 'SHOP HOURS';
  headerRow.getCell(8).value = 'FIELD HOURS';
  headerRow.height = 35;

  for (let c = 3; c <= 8; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (c >= 6 ? 'FFD1D5DB' : 'FFE5E7EB') } };
  }

  const applyCellStyles = (row, startCol, endCol, bold = false, color = '000000', bgColor = null, isCurrency = false) => {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getRow(row).getCell(c);
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      if (bold) cell.font = { bold: true, color: { argb: color } };
      else cell.font = { color: { argb: color } };
      if (bgColor) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      if (isCurrency) {
        cell.numFmt = '"$" #,##0.00';
        cell.alignment = { horizontal: 'center' };
      }
    }
  };

  // Row: SUB TOTAL
  worksheet.getRow(tableStart+1).getCell(2).value = 'SUB TOTAL';
  worksheet.getRow(tableStart+1).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+1).getCell(3).value = steelWeight;
  worksheet.getRow(tableStart+1).getCell(4).value = galvShopHrs;
  worksheet.getRow(tableStart+1).getCell(5).value = galvFieldHrs;
  worksheet.getRow(tableStart+1).getCell(6).value = scrapWeight;
  worksheet.getRow(tableStart+1).getCell(7).value = shopHours;
  worksheet.getRow(tableStart+1).getCell(8).value = fieldHours;
  applyCellStyles(tableStart+1, 2, 8, true);
  worksheet.getRow(tableStart+1).getCell(4).font.color = { argb: 'FFF59E0B' };
  worksheet.getRow(tableStart+1).getCell(5).font.color = { argb: 'FFF59E0B' };

  // Row: STEEL PRICE
  worksheet.getRow(tableStart+2).getCell(2).value = 'STEEL PRICE';
  worksheet.getRow(tableStart+2).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+2).getCell(3).value = steelPrice;
  worksheet.getRow(tableStart+2).getCell(6).value = scrapPrice;
  worksheet.getRow(tableStart+2).getCell(7).value = shopLabor;
  worksheet.getRow(tableStart+2).getCell(8).value = fieldLabor;
  applyCellStyles(tableStart+2, 2, 8, true, 'FFF59E0B', null, true);
  worksheet.getRow(tableStart+2).getCell(2).font.color = { argb: '000000' }; // Keep label black

  // Row: Stair Pans
  worksheet.getRow(tableStart+3).getCell(2).value = 'Stair Pans TOTAL PRICE';
  worksheet.getRow(tableStart+3).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+3).getCell(3).value = pansPrice;
  worksheet.getRow(tableStart+3).getCell(6).value = panPlateWeight;
  worksheet.getRow(tableStart+3).getCell(7).value = panPlateShopHrs;
  worksheet.getRow(tableStart+3).getCell(8).value = 0;
  applyCellStyles(tableStart+3, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+3, 4, 5);
  applyCellStyles(tableStart+3, 6, 8, true);

  // Row: Grating
  worksheet.getRow(tableStart+4).getCell(1).value = gratingPrice > 0 ? 'Yes' : 'No';
  worksheet.getRow(tableStart+4).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gratingPrice > 0 ? 'FFCCF2D1' : 'FFF1F5F9' } };
  worksheet.getRow(tableStart+4).getCell(1).font = { bold: true, color: { argb: gratingPrice > 0 ? 'FF166534' : 'FF94A3B8' } };
  worksheet.getRow(tableStart+4).getCell(2).value = 'STAIR GRATING';
  worksheet.getRow(tableStart+4).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+4).getCell(3).value = gratingPrice;
  applyCellStyles(tableStart+4, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+4, 4, 8);

  // Row: Galvanize
  worksheet.getRow(tableStart+5).getCell(1).value = galvPrice > 0 ? 'Yes' : 'No';
  worksheet.getRow(tableStart+5).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: galvPrice > 0 ? 'FFCCF2D1' : 'FFF1F5F9' } };
  worksheet.getRow(tableStart+5).getCell(1).font = { bold: true, color: { argb: galvPrice > 0 ? 'FF166534' : 'FF94A3B8' } };
  worksheet.getRow(tableStart+5).getCell(2).value = 'Galvanize';
  worksheet.getRow(tableStart+5).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+5).getCell(3).value = galvPrice;
  applyCellStyles(tableStart+5, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+5, 4, 8);

  // Row: Anchor Bolts
  worksheet.getRow(tableStart+6).getCell(2).value = 'Anchor Bolts';
  worksheet.getRow(tableStart+6).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+6).getCell(3).value = anchorsPrice;
  applyCellStyles(tableStart+6, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+6, 4, 8);

  // Row: Por Rok
  worksheet.getRow(tableStart+7).getCell(2).value = 'POR ROK ANCHORS';
  worksheet.getRow(tableStart+7).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+7).getCell(3).value = porRokPrice;
  applyCellStyles(tableStart+7, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+7, 4, 8);

  // Row: Total Material Price
  worksheet.getRow(tableStart+8).getCell(2).value = 'TOTAL MATERIAL PRICE';
  worksheet.getRow(tableStart+8).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+8).getCell(2).font = { bold: true };
  worksheet.getRow(tableStart+8).getCell(3).value = totalMaterialPrice;
  applyCellStyles(tableStart+8, 2, 3, true, 'FFF59E0B', 'FFF8FAFC', true);

  // Row: Price Per Riser
  worksheet.getRow(tableStart+9).getCell(2).value = 'PRICE PER RISER';
  worksheet.getRow(tableStart+9).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+9).getCell(3).value = res.pricePerRiser || 0;
  applyCellStyles(tableStart+9, 2, 3, true, 'FFF59E0B', null);



  // Subtotals Section (Bottom Right)
  const finalStart = 22;
  worksheet.getRow(finalStart).getCell(6).value = 'SUB TOTAL WITH OUT TAX';
  worksheet.getRow(finalStart).getCell(7).value = subtotalNoTax;
  worksheet.getRow(finalStart+1).getCell(6).value = 'TAX';
  worksheet.getRow(finalStart+1).getCell(7).value = tax;
  worksheet.getRow(finalStart+2).getCell(6).value = 'TOTAL ESTIMATE';
  worksheet.getRow(finalStart+2).getCell(7).value = totalEstimate;

  const additionalCosts = typeof projectData?.additionalCosts === 'string' ? JSON.parse(projectData.additionalCosts) : (projectData?.additionalCosts || null);
  const hasAdditionalCosts = additionalCosts && additionalCosts.total;
  let currentFinalRow = finalStart + 2;

  if (hasAdditionalCosts) {
    currentFinalRow++;
    worksheet.getRow(currentFinalRow).getCell(6).value = 'TOTAL W/ ADJUSTMENTS';
    worksheet.getRow(currentFinalRow).getCell(7).value = additionalCosts.total;
  }

  for (let r = finalStart; r <= currentFinalRow; r++) {
    worksheet.getRow(r).getCell(7).numFmt = '"$" #,##0.00';
    const isFinalTotal = r === currentFinalRow;
    worksheet.getRow(r).getCell(7).font = { bold: true, color: { argb: 'FFF59E0B' }, size: isFinalTotal ? 14 : 11 };
    worksheet.getRow(r).getCell(6).font = { bold: true, size: isFinalTotal ? 14 : 11 };
    worksheet.getRow(r).getCell(6).alignment = { horizontal: 'right' };
    worksheet.getRow(r).getCell(6).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    worksheet.getRow(r).getCell(7).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
  }
  worksheet.getRow(currentFinalRow).getCell(6).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };
  worksheet.getRow(currentFinalRow).getCell(7).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };

  // Detailed Line Items Section
  let currentRow = currentFinalRow + 4;
  const detailHeaderRow = worksheet.getRow(currentRow);
  detailHeaderRow.getCell(2).value = 'ITEMIZED ENTRIES (Stringers and Rails)';
  detailHeaderRow.getCell(2).font = { size: 14, bold: true };
  currentRow += 2;

  const applyTableStyle = (row, isHeader = false) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber > 1) { // Skip column A
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        if (isHeader) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } }; // slate-300
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.font = { bold: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center', wrapText: true };
        }
      }
    });
  };

  // Render Stairs
  const stairsArr = Array.isArray(stairs) ? stairs : [];
  if (stairsArr.length > 0) {
    worksheet.getRow(currentRow).getCell(2).value = 'STAIR SUB-ASSEMBLIES';
    worksheet.getRow(currentRow).getCell(2).font = { bold: true };
    currentRow++;

    const sHeader = worksheet.getRow(currentRow);
    sHeader.values = [, 'Ref', 'Category', 'Stair Type', 'Tread Setup', 'Mounting', 'Finish', 'Width', 'Run', 'Rise', 'Height', 'Risers', 'Angle', 'Top Ext (N/S, F/S)', 'Bot Ext (N/S, F/S)', 'Connection', 'Stringer Specs', 'Wt(lbs)'];
    applyTableStyle(sHeader, true);
    currentRow++;

    stairsArr.forEach((s, idx) => {
      const sRow = worksheet.getRow(currentRow);
      let runStr = s.run;
      if (typeof s.run === 'object' && s.run.value) runStr = s.run.value;
      let riseStr = s.rise;
      if (typeof s.rise === 'object' && s.rise.value) riseStr = s.rise.value;
      let widthStr = s.stairWidth || s.width;
      if (typeof widthStr === 'object' && widthStr.value) widthStr = widthStr.value;
      let hghtStr = s.totalHeight;
      if (typeof hghtStr === 'object' && hghtStr.value) hghtStr = hghtStr.value;

      const extNT = typeof s.nsStringerTop === 'object' ? s.nsStringerTop.value : s.nsStringerTop;
      const extFT = typeof s.fsStringerTop === 'object' ? s.fsStringerTop.value : s.fsStringerTop;
      const extNB = typeof s.nsStringerBot === 'object' ? s.nsStringerBot.value : s.nsStringerBot;
      const extFB = typeof s.fsStringerBot === 'object' ? s.fsStringerBot.value : s.fsStringerBot;
      const angleStr = s.angle ? parseFloat(s.angle).toFixed(2) : '0';

      sRow.values = [, 
        s.id ? `Stair ${idx + 1}` : 'Stair',
        s.stairCategory || 'Commercial',
        s.stairType || '-',
        s.gratingType || '-',
        s.mountingType || '-',
        s.finish || '-',
        `${widthStr || 0}'`,
        `${runStr || 0}"`,
        `${riseStr || 0}"`,
        `${hghtStr || 0}'`,
        s.numRisers || 0,
        `${angleStr}°`,
        `${extNT||0}', ${extFT||0}'`,
        `${extNB||0}', ${extFB||0}'`,
        s.nsStringerConnBot || 'Welded',
        `${s.stringerType || 'Rolled'} | ${s.steelGrade || 'A36'} | ${s.stringerSize || '-'}`,
        (s.totalWeight || s.systemCalc?.totalWeight || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      ];
      applyTableStyle(sRow, false);
      currentRow++;
    });
    currentRow += 2;
  }

  // Extract all rails and landings
  const allRails = [];
  const allPlatforms = [];
  if (stairsArr.length > 0) {
    stairsArr.forEach(s => {
      if (s.rails) allRails.push(...s.rails);
      if (s.landings) allPlatforms.push(...s.landings);
    });
  }

  if (allRails.length > 0) {
    worksheet.getRow(currentRow).getCell(2).value = 'RAILING SUB-ASSEMBLIES';
    worksheet.getRow(currentRow).getCell(2).font = { bold: true };
    currentRow++;

    const rHeader = worksheet.getRow(currentRow);
    rHeader.values = [, 'Type', 'Length', 'Steel Grade', 'Actual Spacing', 'Int Rails', 'Post Qty', 'Bracket Qty', 'Toe Plate Req\'d', 'Mounting', 'Finish', 'Wt(lbs)'];
    applyTableStyle(rHeader, true);
    currentRow++;

    allRails.forEach(r => {
      const rRow = worksheet.getRow(currentRow);
      let lenStr = r.railLength || r.length;
      if (typeof lenStr === 'object' && lenStr.value) lenStr = lenStr.value;
      
      const actualSpacing = r.systemCalc?.actualSpacing 
        ? Number(r.systemCalc.actualSpacing).toFixed(3) 
        : (typeof r.postSpacing === 'object' ? r.postSpacing.value : r.postSpacing);
      
      const postQty = r.systemCalc?.posts || r.postQty || '-';
      const bracketQty = r.systemCalc?.bracketQty || r.bracketQty || '-';

      rRow.values = [,
        r.railType || r.typeCode || 'Railing',
        `${lenStr || 0}'`,
        r.steelGrade || 'A53',
        actualSpacing || 0,
        r.intermediateRails || '-',
        postQty,
        bracketQty,
        r.toeplateRequired || 'No',
        r.mountingType || '-',
        r.finish || '-',
        (r.totalWeight || r.systemCalc?.totalWeight || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      ];
      applyTableStyle(rRow, false);
      currentRow++;
    });
    currentRow += 2;
  }

  if (allPlatforms.length > 0) {
    worksheet.getRow(currentRow).getCell(2).value = 'PLATFORM SUB-ASSEMBLIES';
    worksheet.getRow(currentRow).getCell(2).font = { bold: true };
    currentRow++;

    const pHeader = worksheet.getRow(currentRow);
    pHeader.values = [, 'Type', 'Length (ft)', 'Width (ft)', 'Finish'];
    applyTableStyle(pHeader, true);
    currentRow++;

    allPlatforms.forEach(p => {
      const pRow = worksheet.getRow(currentRow);
      let lenStr = p.platformLength || p.length;
      if (typeof lenStr === 'object' && lenStr.value) lenStr = lenStr.value;
      let wStr = p.platformWidth || p.width;
      if (typeof wStr === 'object' && wStr.value) wStr = wStr.value;

      pRow.values = [,
        p.platformType || p.type || 'Platform',
        lenStr || 0,
        wStr || 0,
        p.finish || '-'
      ];
      applyTableStyle(pRow, false);
      currentRow++;
    });
  }

  // Auto-fit new columns properly so text doesn't overflow
  [10, 11, 12, 13, 14, 15, 16, 17, 18].forEach(colIndex => {
    const col = worksheet.getColumn(colIndex);
    if (!col.width || col.width < 14) {
      col.width = 14; 
    }
  });

  // Download File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  if (returnBlob) return blob;
  saveAs(blob, `${projectData.projectName || 'Project'}_Estimate_BOM.xlsx`);
};

