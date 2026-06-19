const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/edhub/Desktop/placement tracker/client/src/components/dsa/v5';

fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  content = content.replace(/\\\\n/g, '\\n');
  if (content !== original) {
    fs.writeFileSync(p, content);
    console.log('Fixed ' + f);
  }
});
