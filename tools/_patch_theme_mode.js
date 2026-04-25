// Patch index.js: noop setThemeMode
// Uses Node.js Buffer to avoid encoding corruption
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app_src', '.vite', 'build', 'index.js');
const buf = fs.readFileSync(file);
const content = buf.toString('utf-8');

const old = 'setThemeMode(t){pA.nativeTheme.themeSource=t,Sn.set("userThemeMode",t)}';
const replacement = 'setThemeMode(t){}';

if (!content.includes(old)) {
  console.error('Pattern not found! Already patched or changed.');
  process.exit(1);
}

const patched = content.replace(old, replacement);
fs.writeFileSync(file, patched, 'utf-8');

// Verify
const verify = fs.readFileSync(file, 'utf-8');
console.log('setThemeMode patched:', verify.includes('setThemeMode(t){}'));
console.log('Original gone:', !verify.includes(old));
console.log('File size:', fs.statSync(file).size);
