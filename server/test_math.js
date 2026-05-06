const { StairCalculationService } = require('./src/services/calculation/StairCalculationService');
const db = require('./src/config/mssql');
const configManager = require('./src/utils/configManager');

async function test() {
  const srv = new StairCalculationService();
  // Mock dependencies just enough to run estimateStair or we can just trace the math
  // Actually, I don't need to run it, I can just console.log the math directly here
  console.log("254.4 * 0.75 = ", 254.4 * 0.75);
}
test();
