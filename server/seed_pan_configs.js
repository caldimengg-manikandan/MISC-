require('dotenv').config();
const db = require('./src/config/mssql');

const basePanConfigs = [
  // 12ga configurations
  {
    label: '12ga TYPE-1(Z shape) + Type-1(Single support)',
    value: 'PAN_12GA_TYPE1Z_SINGLE',
    steelLbsLf: 4.27,    
    shopLaborMhLf: 1.2,  
    fieldLaborMhLf: 0,   
    spanMax: 8.0,        
    widthMin: 0.1046,    
    isSystemDefault: 1,
  },
  {
    label: '12ga TYPE-1(Z shape) + Type-2(Dual support)',
    value: 'PAN_12GA_TYPE1Z_DUAL',
    steelLbsLf: 4.27,    
    shopLaborMhLf: 1.25,  
    fieldLaborMhLf: 0,   
    spanMax: 8.0,        
    widthMin: 0.1046,    
    isSystemDefault: 1,
  },
  // 10ga configurations
  {
    label: '10ga TYPE-1(Z shape) + Type-1(Single support)',
    value: 'PAN_10GA_TYPE1Z_SINGLE',
    steelLbsLf: 5.46,    
    shopLaborMhLf: 1.2,  
    fieldLaborMhLf: 0,   
    spanMax: 8.0,        
    widthMin: 0.1345,    
    isSystemDefault: 1,
  },
  {
    label: '10ga TYPE-1(Z shape) + Type-2(Dual support)',
    value: 'PAN_10GA_TYPE1Z_DUAL',
    steelLbsLf: 5.46,    
    shopLaborMhLf: 1.25,  
    fieldLaborMhLf: 0,   
    spanMax: 8.0,        
    widthMin: 0.1345,    
    isSystemDefault: 1,
  },
  // 7ga configurations
  {
    label: '7ga TYPE-1(Z shape) + Type-1(Single support)',
    value: 'PAN_7GA_TYPE1Z_SINGLE',
    steelLbsLf: 7.32,    
    shopLaborMhLf: 1.2,  
    fieldLaborMhLf: 0,   
    spanMax: 8.0,        
    widthMin: 0.1793,    
    isSystemDefault: 1,
  },
  {
    label: '7ga TYPE-1(Z shape) + Type-2(Dual support)',
    value: 'PAN_7GA_TYPE1Z_DUAL',
    steelLbsLf: 7.32,
    shopLaborMhLf: 1.25,
    fieldLaborMhLf: 0,
    spanMax: 8.0,
    widthMin: 0.1793,
    isSystemDefault: 1,
  },
  // 1/4" Plate configurations
  {
    label: '1/4" Plate TYPE-1(Z shape) + Type-1(Single support)',
    value: 'PAN_1/4IN_TYPE1Z_SINGLE',
    steelLbsLf: 10.21,
    shopLaborMhLf: 1.3,
    fieldLaborMhLf: 0,
    spanMax: 8.0,
    widthMin: 0.2500,
    isSystemDefault: 1,
  },
  {
    label: '1/4" Plate TYPE-1(Z shape) + Type-2(Dual support)',
    value: 'PAN_1/4IN_TYPE1Z_DUAL',
    steelLbsLf: 10.21,
    shopLaborMhLf: 1.35,
    fieldLaborMhLf: 0,
    spanMax: 8.0,
    widthMin: 0.2500,
    isSystemDefault: 1,
  }
];

async function seedPanConfigs() {
  console.log('Seeding pan plate configurations into dictionary...');
  try {
    for (const config of basePanConfigs) {
      // Check if it already exists
      const [existing] = await db.query(
        'SELECT id FROM dictionary WHERE category = ? AND value = ?',
        ['pan_plate_config', config.value]
      );
      
      if (existing && existing.length > 0) {
        console.log(`Config ${config.value} already exists, skipping...`);
        continue;
      }
      
      await db.query(
        `INSERT INTO dictionary 
         (category, label, value, steelLbsLf, shopLaborMhLf, fieldLaborMhLf, spanMax, widthMin, is_system_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())`,
        ['pan_plate_config', config.label, config.value, 
         config.steelLbsLf, config.shopLaborMhLf, config.fieldLaborMhLf,
         config.spanMax, config.widthMin, config.isSystemDefault]
      );
      console.log(`Inserted: ${config.label}`);
    }
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding pan configs:', error);
  } finally {
    process.exit(0);
  }
}

seedPanConfigs();
