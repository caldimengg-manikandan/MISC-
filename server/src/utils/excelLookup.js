const fs = require('fs');
const path = require('path');

class ExcelLookup {
  constructor() {
    this.data = null;
    this.filePath = path.join(__dirname, '../../../Misc Worksheet  reworked KDF 11-12-25.json');
    this.loadData();
  }

  loadData() {
    try {
      const rawData = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log('✅ Excel Lookup Data Loaded Successfully');
    } catch (error) {
      console.error('❌ Failed to load Excel Lookup Data:', error);
      this.data = {};
    }
  }

  /**
   * VLOOKUP equivalent
   * @param {string} sheetName - The sheet/table name in the JSON
   * @param {string} searchValue - The value to look for
   * @param {string|number} resultColumn - The column name or index to return
   * @param {any} fallback - Value to return if not found (default 0)
   * @returns {any} The found value or fallback
   */
  lookup(sheetName, searchValue, resultColumn, fallback = 0) {
    if (!this.data || !this.data[sheetName]) return fallback;

    const sheet = this.data[sheetName];
    const searchLower = String(searchValue).toLowerCase().trim();

    for (const row of sheet) {
      if (!row) continue;
      
      const foundIdent = Object.values(row).some(val => {
        if (val === null) return false;
        return String(val).toLowerCase().trim() === searchLower;
      });

      if (foundIdent && row[resultColumn] !== undefined) {
        return row[resultColumn];
      }
    }
    return fallback;
  }

  /**
   * Get all rows of a virtual table/sheet
   */
  getTable(sheetName) {
    return this.data[sheetName] || [];
  }
}

module.exports = new ExcelLookup();
