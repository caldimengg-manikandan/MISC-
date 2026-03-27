const { getTypeCode } = require('./src/config/railConfig');

const label = '1-Line Hand Railing wall bolted - 1 1/4" SCH 40 pipe';
console.log('Label:', label);
console.log('Result TypeCode:', getTypeCode(label));
process.exit(0);
