const fs = require('fs');
const filePath = 'C:/Users/edhub/Desktop/placement tracker/server/controllers/interviewIntelligenceController.js';
let content = fs.readFileSync(filePath);
// If it's UTF-16LE interpreted as UTF-8, it has null bytes
let fixed = Buffer.from(content.filter(b => b !== 0)).toString('utf8');
fs.writeFileSync(filePath, fixed);
console.log('Fixed file');
