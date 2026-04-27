const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Excel file
const wb = xlsx.readFile(path.join(__dirname, 'dataset_v5.xlsx'));

// Helper to infer column type from sample values
function inferType(values) {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmpty.length === 0) return 'text';
  
  const sample = nonEmpty.slice(0, 10);
  
  // Check if all are numbers
  if (sample.every(v => typeof v === 'number')) {
    // Check if it looks like a date (Excel serial date)
    if (sample.every(v => v > 40000 && v < 50000)) {
      return 'date';
    }
    return 'number';
  }
  
  // Check if email
  if (sample.every(v => typeof v === 'string' && v.includes('@'))) {
    return 'email';
  }
  
  // Check if it looks like a phone number
  if (sample.every(v => typeof v === 'string' && /^[\d\s\-\+\(\)]+$/.test(v))) {
    return 'phone';
  }
  
  return 'text';
}

// Helper to get unique values for potential single-select fields
function getUniqueValues(values) {
  const unique = [...new Set(values.filter(v => v !== null && v !== undefined && v !== ''))];
  return unique.slice(0, 20); // Limit to 20 unique values
}

// Helper to convert column name to field name (camelCase)
function toFieldName(columnName) {
  return columnName
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

// Process each sheet
const columnConfig = {
  _instructions: "Edit this file to configure column types and settings. Then run convert-with-config.js",
  sheets: {}
};

wb.SheetNames.forEach(sheetName => {
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
  if (data.length === 0) return;
  
  const columns = Object.keys(data[0]);
  
  columnConfig.sheets[sheetName] = {
    tableName: sheetName,
    tableId: `tbl-${sheetName.toLowerCase().replace(/\s+/g, '-')}`,
    icon: "document",
    columns: columns.map((col, index) => {
      // Get all values for this column
      const values = data.map(row => row[col]);
      const inferredType = inferType(values);
      const uniqueValues = getUniqueValues(values);
      
      const colDef = {
        id: `col-${index + 1}`,
        field: toFieldName(col),
        title: col,
        type: inferredType,
        width: 150,
        required: false
      };
      
      // Add sample unique values for reference (you can use these to create options)
      if (uniqueValues.length <= 10 && uniqueValues.length > 0) {
        colDef._sampleValues = uniqueValues;
        colDef._hint = "If this should be single-select, change type to 'single-select' and add 'options' array";
      }
      
      // Add hints for special types
      if (inferredType === 'number') {
        colDef.decimalPlaces = 0;
        colDef._hint = "Set decimalPlaces for decimal numbers";
      }
      
      if (inferredType === 'date') {
        colDef.dateFormat = "YYYY-MM-DD";
      }
      
      return colDef;
    }),
    // Sample data for reference
    _sampleRows: data.slice(0, 3)
  };
});

// Write column config to file
const outputPath = path.join(__dirname, 'column-config.json');
fs.writeFileSync(outputPath, JSON.stringify(columnConfig, null, 2));

console.log('Column configuration extracted!');
console.log(`Sheets found: ${wb.SheetNames.join(', ')}`);
console.log(`\nOutput written to: ${outputPath}`);
console.log('\n=== Next Steps ===');
console.log('1. Open column-config.json and edit the column settings');
console.log('2. Change "type" to: text, number, date, email, single-select, relation, etc.');
console.log('3. For single-select, add "options" array with {id, label, color}');
console.log('4. For relation, add "relationConfig" with {tableId, displayField, multiple}');
console.log('5. Run: node convert-with-config.js');

