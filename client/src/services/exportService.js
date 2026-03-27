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
export const generateProposalPDF = (projectData, stairs) => {
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
  doc.text('CALDIM ENGINEERING STANDARDS', 160, 29);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(`PROJECT: ${projectData.projectName || 'Unnamed Project'}`, 15, 55);
  doc.text(`NUMBER: ${projectData.projectNumber || 'N/A'}`, 15, 62);
  doc.setLineWidth(0.5);
  doc.line(15, 66, 195, 66);

  let currentY = 75;

  stairs.forEach((stair, idx) => {
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
      ['Tread Pans', stair.panPlThk || '12ga', `${stair.calcPanArea || 0} SQFT`, `${stair.calcPanSteelWeight || 0}`],
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

  const totalWeight = stairs.reduce((sum, s) => sum + parseFloat(s.calcStringerWeight || 0) + parseFloat(s.calcPanSteelWeight || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ESTIMATION SUMMARY', 15, currentY + 10);
  const finishArea = stairs.reduce((sum, s) => sum + calculateSurfaceArea(s), 0);
  
  autoTable(doc, {
    startY: currentY + 15,
    body: [
      ['TOTAL STEEL WEIGHT (w/ 11% Scrap)', `${totalWeight.toFixed(2)} lbs`],
      ['FINISHING SURFACE AREA (for Galv)', `${finishArea.toFixed(2)} SQFT`],
      ['TOTAL FABRICATION HOURS', '— Hrs'],
      ['TOTAL ESTIMATED COST', '— USD']
    ],
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 5 }
  });

  doc.save(`${projectData.projectName || 'Project'}_Proposal.pdf`);
};

/**
 * Fabrication BOM Excel Generator (ExcelJS implementation)
 * Updated to match EXACTLY the latest summary layout and calculation methodology 
 * identified from the user's Excel spreadsheet screenshot.
 */
export const generateFabricationExcel = async (projectData, stairs, estimationResult = null) => {
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
  const res = estimationResult?.summary || {};
  const priceLb = 0.75;
  const laborRate = 70;
  
  const steelWeight = res.baseSteelWeight || stairs.reduce((sum, s) => sum + (s.systemCalc?.stairWeight || 0), 0);
  const scrapWeight = res.scrapWeight || (steelWeight * 0.1);
  const shopHours = res.totalShopHours || stairs.reduce((sum, s) => sum + (s.systemCalc?.totalShopHours || 0), 0);
  const fieldHours = res.totalFieldHours || stairs.reduce((sum, s) => sum + (s.systemCalc?.totalFieldHours || 0), 0);

  const steelPrice = steelWeight * priceLb;
  const scrapPrice = scrapWeight * priceLb;
  const shopLabor = shopHours * laborRate;
  const fieldLabor = fieldHours * laborRate;

  const pansPrice = res.pansMaterialPrice || 0;
  const gratingPrice = res.gratingCost || 0;
  const galvPrice = res.galvanizeCost || 0;
  const anchorsPrice = res.anchorBoltsCost || 0;
  const porRokPrice = res.porRokCost || 0;

  const totalMaterialPrice = steelPrice + pansPrice + gratingPrice + galvPrice + anchorsPrice + porRokPrice;
  const tax = totalMaterialPrice * 0.06;
  const subtotalNoTax = totalMaterialPrice + shopLabor + fieldLabor + scrapPrice;
  const totalEstimate = subtotalNoTax + tax;

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
  worksheet.getRow(tableStart+1).getCell(4).value = 5.5;
  worksheet.getRow(tableStart+1).getCell(5).value = 5.75;
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
  applyCellStyles(tableStart+3, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+3, 4, 8);

  // Row: Grating
  worksheet.getRow(tableStart+4).getCell(1).value = 'Yes';
  worksheet.getRow(tableStart+4).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCF2D1' } };
  worksheet.getRow(tableStart+4).getCell(2).value = 'STAIR GRATING';
  worksheet.getRow(tableStart+4).getCell(2).alignment = { horizontal: 'right' };
  worksheet.getRow(tableStart+4).getCell(3).value = gratingPrice;
  applyCellStyles(tableStart+4, 2, 3, true, 'FFF59E0B', null, true);
  applyCellStyles(tableStart+4, 4, 8);

  // Row: Galvanize
  worksheet.getRow(tableStart+5).getCell(1).value = 'Yes';
  worksheet.getRow(tableStart+5).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCF2D1' } };
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

  // Constants Sidebar (Yellow Inputs)
  const sideCol = 10;
  worksheet.getRow(11).getCell(sideCol).value = 'Price Per LB:';
  worksheet.getRow(11).getCell(sideCol+1).value = 0.75;
  worksheet.getRow(13).getCell(sideCol).value = 'Shop Hourly Rate:';
  worksheet.getRow(13).getCell(sideCol+1).value = 70;
  worksheet.getRow(14).getCell(sideCol).value = 'Field Hourly Rate:';
  worksheet.getRow(14).getCell(sideCol+1).value = 70;
  worksheet.getRow(15).getCell(sideCol).value = 'Sales Tax:';
  worksheet.getRow(15).getCell(sideCol+1).value = 0.06;

  [11, 13, 14].forEach(r => {
    worksheet.getRow(r).getCell(sideCol+1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
    worksheet.getRow(r).getCell(sideCol+1).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };
    worksheet.getRow(r).getCell(sideCol+1).font = { bold: true };
    worksheet.getRow(r).getCell(sideCol+1).numFmt = '"$" #,##0.00';
  });
  worksheet.getRow(15).getCell(sideCol+1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
  worksheet.getRow(15).getCell(sideCol+1).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };
  worksheet.getRow(15).getCell(sideCol+1).font = { bold: true };
  worksheet.getRow(15).getCell(sideCol+1).numFmt = '0%';

  // Subtotals Section (Bottom Right)
  const finalStart = 22;
  worksheet.getRow(finalStart).getCell(6).value = 'SUB TOTAL WITH OUT TAX';
  worksheet.getRow(finalStart).getCell(7).value = subtotalNoTax;
  worksheet.getRow(finalStart+1).getCell(6).value = 'TAX';
  worksheet.getRow(finalStart+1).getCell(7).value = tax;
  worksheet.getRow(finalStart+2).getCell(6).value = 'TOTAL ESTIMATE';
  worksheet.getRow(finalStart+2).getCell(7).value = totalEstimate;

  for (let r = finalStart; r <= finalStart+2; r++) {
    worksheet.getRow(r).getCell(7).numFmt = '"$" #,##0.00';
    worksheet.getRow(r).getCell(7).font = { bold: true, color: { argb: 'FFF59E0B' }, size: r === finalStart+2 ? 14 : 11 };
    worksheet.getRow(r).getCell(6).font = { bold: true, size: r === finalStart+2 ? 14 : 11 };
    worksheet.getRow(r).getCell(6).alignment = { horizontal: 'right' };
    worksheet.getRow(r).getCell(6).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    worksheet.getRow(r).getCell(7).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
  }
  worksheet.getRow(finalStart+2).getCell(6).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };
  worksheet.getRow(finalStart+2).getCell(7).border = { top: {style:'medium'}, left: {style:'medium'}, bottom: {style:'medium'}, right: {style:'medium'} };

  // Download File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${projectData.projectName || 'Project'}_Estimate_BOM.xlsx`);
};
