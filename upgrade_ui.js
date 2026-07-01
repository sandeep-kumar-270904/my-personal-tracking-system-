const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/src/pages');
const componentsDir = path.join(__dirname, 'client/src/components');

function upgradeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace old tailwind classes with new aesthetic
  content = content.replace(/bg-slate-900/g, 'bg-[#0a0a0f]');
  content = content.replace(/bg-slate-800\/50/g, 'bg-white/[0.02]');
  content = content.replace(/bg-slate-800\/60/g, 'bg-white/[0.03]');
  content = content.replace(/bg-slate-800/g, 'bg-[#13141f]');
  content = content.replace(/border-slate-700\/50/g, 'border-white/5');
  content = content.replace(/border-slate-700/g, 'border-white/10');
  content = content.replace(/border-slate-600/g, 'border-white/20');
  content = content.replace(/text-slate-100/g, 'text-white');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-white/[0.05]');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-[#13141f]');
  
  // Fix gradients
  content = content.replace(/from-blue-600 to-violet-600/g, 'from-[#ff6b00] to-[#ff007b]');
  content = content.replace(/from-blue-500 to-violet-500/g, 'from-[#ff6b00] to-[#ff007b]');
  content = content.replace(/bg-blue-600/g, 'bg-[#ff6b00]');
  content = content.replace(/hover:bg-blue-700/g, 'hover:bg-[#ff007b]');
  content = content.replace(/text-blue-400/g, 'text-[#00f0ff]');
  content = content.replace(/text-blue-500/g, 'text-[#ff6b00]');
  
  // If we find .glass that we didn't remove from classNames, replace it with glass-card
  content = content.replace(/\bglass\b/g, 'glass-card');
  
  fs.writeFileSync(filePath, content);
}

// Pages
fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).forEach(file => {
  upgradeFile(path.join(dir, file));
});

// Components (like GoalModal, ApplicationModal, etc.)
const componentsList = [
  'GoalModal.jsx',
  'ResumeModal.jsx',
  'ApplicationModal.jsx',
  'CodeBlock.jsx',
  'OfferModal.jsx',
  'OfferDetailsModal.jsx',
  'Navbar.jsx', // Might have missed something
];

componentsList.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if(fs.existsSync(filePath)) {
     upgradeFile(filePath);
  }
});

console.log("UI Upgraded!");
