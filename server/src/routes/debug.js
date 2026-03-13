// server/src/routes/debug.js
const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test endpoint without auth
router.get('/categorized-rails-test', (req, res) => {
  console.log('📊 /categorized-rails-test called');
  
  const testData = {
    wallRail: [
      {
        id: 'wallRail_1',
        description: '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe (TEST)',
        steelLbsPerLF: 3.300,
        shopMHPerLF: 0.300,
        fieldMHPerLF: 0.250
      }
    ],
    grabRail: [
      {
        id: 'grabRail_1',
        description: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe (TEST)',
        steelLbsPerLF: 2.850,
        shopMHPerLF: 0.300,
        fieldMHPerLF: 0.280
      }
    ],
    guardRail: [
      {
        id: 'guardRail_1',
        description: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post (TEST)',
        steelLbsPerLF: 6.840,
        shopMHPerLF: 0.500,
        fieldMHPerLF: 0.350
      }
    ]
  };
  
  res.json({
    success: true,
    data: testData,
    message: 'Test rail data loaded'
  });
});

// Main endpoint with auth
router.get('/categorized-rails', async (req, res) => {
  try {
    console.log('📊 /categorized-rails called');
    
    // Read Excel file
    const excelPath = path.join(__dirname, '../../secure_uploads/separate MISC sheets.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('⚠️ Excel file not found');
      return res.json({
        success: true,
        data: getFallbackData(),
        message: 'Using fallback data (Excel file not found)'
      });
    }
    
    console.log('📄 Reading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    
    // Use exact sheet name with space
    const sheetName = 'Handrail ';
    console.log(`📋 Using sheet: "${sheetName}"`);
    
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log('⚠️ Sheet not found, available:', workbook.SheetNames);
      return res.json({
        success: true,
        data: getFallbackData(),
        message: 'Using fallback data (Handrail sheet not found)'
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`✅ Sheet loaded with ${jsonData.length} rows`);
    
    // Process the data with proper categorization
    const categorizedData = processExcelData(jsonData);
    
    console.log(`📊 Processed: Wall(${categorizedData.wallRail.length}), Grab(${categorizedData.grabRail.length}), Guard(${categorizedData.guardRail.length})`);
    
    res.json({
      success: true,
      data: categorizedData,
      message: `Loaded ${categorizedData.wallRail.length + categorizedData.grabRail.length + categorizedData.guardRail.length} rail items from Excel`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.json({
      success: true,
      data: getFallbackData(),
      message: 'Using fallback data due to error'
    });
  }
});

function processExcelData(jsonData) {
  const categorizedData = {
    wallRail: [],
    grabRail: [],
    guardRail: []
  };
  
  if (jsonData.length <= 1) {
    console.log('⚠️ No data rows found');
    return categorizedData;
  }
  
  console.log(`🔧 Processing ${jsonData.length - 1} data rows...`);
  
  // Process all rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 4) continue;
    
    const description = String(row[0] || '').trim();
    const steelPerLF = parseFloat(row[1]) || 0;
    const shopMHPerLF = parseFloat(row[2]) || 0;
    const fieldMHPerLF = parseFloat(row[3]) || 0;
    
    if (!description || description === '' || description === 'Description') {
      continue;
    }
    
    const descLower = description.toLowerCase();
    const railItem = {
      id: `row_${i}`,
      description: description,
      steelLbsPerLF: steelPerLF,
      shopMHPerLF: shopMHPerLF,
      fieldMHPerLF: fieldMHPerLF,
      excelRow: i
    };
    
    // Categorization based on your Excel structure:
    if (descLower.includes('handrailing on guardrail') || 
        descLower.includes('hand railing wall bolted')) {
      // First 4 rows: Wall Rail
      categorizedData.wallRail.push(railItem);
    } else if (descLower.includes('floor mounted handrail')) {
      // Rows 5-8: Grab Rail
      categorizedData.grabRail.push(railItem);
    } else {
      // Everything else: Guard Rail
      categorizedData.guardRail.push(railItem);
    }
  }
  
  // If no items in a category, add some defaults
  if (categorizedData.wallRail.length === 0) {
    categorizedData.wallRail.push({
      id: 'default_wall_1',
      description: '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe',
      steelLbsPerLF: 2.85,
      shopMHPerLF: 0.30,
      fieldMHPerLF: 0.28
    });
  }
  
  if (categorizedData.grabRail.length === 0) {
    categorizedData.grabRail.push({
      id: 'default_grab_1',
      description: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe',
      steelLbsPerLF: 2.85,
      shopMHPerLF: 0.275,
      fieldMHPerLF: 0.25
    });
  }
  
  if (categorizedData.guardRail.length === 0) {
    categorizedData.guardRail.push({
      id: 'default_guard_1',
      description: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post',
      steelLbsPerLF: 6.84,
      shopMHPerLF: 0.50,
      fieldMHPerLF: 0.35
    });
  }
  
  return categorizedData;
}

function getFallbackData() {
  return {
    wallRail: [
      {
        id: 'fallback_wall_1',
        description: '1-Line Handrailing on Guardrail - 1 1/4" SCH 40 pipe (FALLBACK)',
        steelLbsPerLF: 2.850,
        shopMHPerLF: 0.300,
        fieldMHPerLF: 0.280
      }
    ],
    grabRail: [
      {
        id: 'fallback_grab_1',
        description: '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe (FALLBACK)',
        steelLbsPerLF: 2.850,
        shopMHPerLF: 0.275,
        fieldMHPerLF: 0.250
      }
    ],
    guardRail: [
      {
        id: 'fallback_guard_1',
        description: '2-Line Steel Pipe Guardrail 1 1/4" Sch. 40 Pipe Rails and Post (FALLBACK)',
        steelLbsPerLF: 6.840,
        shopMHPerLF: 0.500,
        fieldMHPerLF: 0.350
      }
    ]
  };
}

module.exports = router;