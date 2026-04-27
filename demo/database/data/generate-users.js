const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Excel file
const wb = xlsx.readFile(path.join(__dirname, 'dataset_v5.xlsx'));
const salesData = xlsx.utils.sheet_to_json(wb.Sheets['Sales']);

// Email domain - you can change this
const EMAIL_DOMAIN = 'docpal.com';

// Generate users from Sales data
const users = salesData
  .filter(row => row['id'] && row['name']) // Only include rows with id and name
  .map((row) => {
    const id = row['id'];
    const name = row['name'];
    const role = row['role'] || 'Sales Representative';
    
    // Generate email from name (firstname.lastname@company.com)
    const nameParts = name.toLowerCase().split(' ');
    const email = nameParts.length >= 2 
      ? `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${EMAIL_DOMAIN}`
      : `${nameParts[0]}@${EMAIL_DOMAIN}`;
    
    // Generate avatar
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`;
    
    return {
      id,
      name,
      email,
      avatar,
      role
    };
  });

// Build the output
const output = {
  users: users
};

// Write to sales-users.json (not overwriting users.json)
const outputPath = path.join(__dirname, 'sales-users.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('Users generated!');
console.log(`Total users: ${users.length}`);
console.log(`Output written to: ${outputPath}`);
console.log('\nGenerated users:');
users.forEach(u => {
  console.log(`  - ${u.id} | ${u.name} | ${u.email} | ${u.role}`);
});

