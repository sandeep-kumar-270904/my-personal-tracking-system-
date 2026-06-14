const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace standard wrapper
  content = content.replace(/<main className="flex-1 ml-64 p-8"/g, '<main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-8"');
  // Handle DashboardPage specifically which has overflow-y-auto h-screen
  content = content.replace(/<main className="flex-1 ml-64 p-8 overflow-y-auto h-screen"/g, '<main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 overflow-y-auto h-screen"');
  
  fs.writeFileSync(filePath, content);
});

console.log("Margins fixed!");
