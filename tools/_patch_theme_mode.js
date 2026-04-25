// Patch index.js: noop setThemeMode + HSA() reads theme.json
// Uses Node.js Buffer to avoid encoding corruption (PowerShell's Replace() causes cp932 mojibake)
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', '..', 'claude-theme-mod-work', 'app_src', '.vite', 'build', 'index.js');
let content = fs.readFileSync(file, 'utf-8');

// --- Patch 1: setThemeMode noop ---
const stmOld = 'setThemeMode(t){pA.nativeTheme.themeSource=t,Sn.set("userThemeMode",t)}';
const stmNew = 'setThemeMode(t){}';

if (content.includes(stmOld)) {
  content = content.replace(stmOld, stmNew);
  console.log('[1] setThemeMode: patched to noop');
} else if (content.includes(stmNew)) {
  console.log('[1] setThemeMode: already patched');
} else {
  console.error('[1] setThemeMode: pattern not found!');
  process.exit(1);
}

// --- Patch 2: HSA() reads bgMain from theme.json ---
const hsaOld = 'function HSA(){return pA.nativeTheme.shouldUseDarkColors?"#1f1f1e":"#fdfdfc"}';
// New HSA reads ~/.claude/theme.json bgMain, fallback to #fdfdfc
const hsaNew = 'function HSA(){try{var t=require("path"),r=require("fs"),n=JSON.parse(r.readFileSync(t.join(require("os").homedir(),".claude","theme.json"),"utf-8").replace(/^\\uFEFF/,""));return n.bgMain||"#fdfdfc"}catch{return"#fdfdfc"}}';

if (content.includes(hsaOld)) {
  content = content.replace(hsaOld, hsaNew);
  console.log('[2] HSA(): patched to read theme.json bgMain');
} else if (content.includes('HSA(){try{')) {
  console.log('[2] HSA(): already patched');
} else {
  console.error('[2] HSA(): pattern not found!');
  // Show what's around HSA for debugging
  const idx = content.indexOf('function HSA(');
  if (idx > -1) console.error('    Found at:', content.substring(idx, idx + 100));
  process.exit(1);
}

// --- Patch 3: ext() reads bgMain from theme.json for view backgrounds ---
const extOld = 'function ext(e,A){return e==="dark"?"#131312":A?"#ffffff":"#f5f5f5"}';
const extNew = 'function ext(e,A){try{var t=require("path"),r=require("fs"),n=JSON.parse(r.readFileSync(t.join(require("os").homedir(),".claude","theme.json"),"utf-8").replace(/^\\uFEFF/,""));return n.bgMain||(e==="dark"?"#131312":A?"#ffffff":"#f5f5f5")}catch{return e==="dark"?"#131312":A?"#ffffff":"#f5f5f5"}}';

if (content.includes(extOld)) {
  content = content.replace(extOld, extNew);
  console.log('[3] ext(): patched to read theme.json bgMain');
} else if (content.includes('ext(e,A){try{')) {
  console.log('[3] ext(): already patched');
} else {
  console.error('[3] ext(): pattern not found!');
  const idx = content.indexOf('function ext(');
  if (idx > -1) console.error('    Found at:', content.substring(idx, idx + 100));
}

// --- Write ---
fs.writeFileSync(file, content, 'utf-8');

// --- Verify ---
const verify = fs.readFileSync(file, 'utf-8');
console.log('\nVerification:');
console.log('  setThemeMode noop:', verify.includes('setThemeMode(t){}'));
console.log('  HSA reads theme.json:', verify.includes('HSA(){try{'));
console.log('  ext reads theme.json:', verify.includes('ext(e,A){try{'));
console.log('  File size:', fs.statSync(file).size);
