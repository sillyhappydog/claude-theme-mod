// Claude Theme Loader v0.3 — Injector
// Usage: node tools/inject_theme_loader.js
//
// Patches Claude Desktop's index.js (Electron main process) with a theme
// loader that reads ~/.claude/theme.json and hot-reloads on file changes.
//
// 2-point injection:
//   Point A: Theme loader code + fs.watchFile appended at module scope
//   Point B: dom-ready handler patched to call __themeApply()
//
// Idempotent: safe to run multiple times. Skips if already injected.
// Does NOT modify mainView.js, index.html, or any preload scripts.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Theme loader code to inject at module scope (Point A) ──

const THEME_LOADER_CODE = `

// ── Claude Theme Loader v0.3 ──
// Reads ~/.claude/theme.json and applies CSS via webContents.insertCSS().
// Watches for file changes and hot-reloads without restart.

const __themeFs = require('fs');
const __themePath = require('path');
const __themeOs = require('os');

const __THEME_FILE = __themePath.join(__themeOs.homedir(), '.claude', 'theme.json');
let __themeCSSKey = null;

const __THEME_VAR_MAP = {
  bgMain:        [['--bg-000', 'hsl'], ['--bg-400', 'hsl'], ['--bg-500', 'hsl']],
  bgSidebar:     [['--bg-100', 'hsl'], ['--bg-200', 'hsl+4'], ['--bg-300', 'hsl+8']],
  textPrimary:   [['--text-000', 'hsl'], ['--text-100', 'hsl']],
  textSecondary: [['--text-200', 'hsl'], ['--text-300', 'hsl']],
  textMuted:     [['--text-400', 'hsl'], ['--text-500', 'hsl']],
  accentPrimary: [['--accent-brand', 'hsl'], ['--brand-100', 'hsl']],
  borderColor:   [['--border-100', 'hsl'], ['--border-200', 'hsl'], ['--border-300', 'hsl'], ['--border-400', 'hsl']],
};

function __themeHexToHSL(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function __themeIsValidColor(val) {
  if (typeof val !== 'string') return false;
  // Allow #RGB, #RRGGBB, #RRGGBBAA (3, 4, 6, or 8 hex digits)
  return /^#[0-9a-fA-F]{3,8}$/.test(val);
}

function __themeBuildCSS(theme) {
  // Build variable declarations
  let vars = '';
  for (const [key, mappings] of Object.entries(__THEME_VAR_MAP)) {
    if (!theme[key] || !__themeIsValidColor(theme[key])) continue;
    const hsl = __themeHexToHSL(theme[key]);
    for (const [varName, mode] of mappings) {
      let lVal = hsl.l;
      if (mode.startsWith('hsl+')) lVal = Math.min(hsl.l + parseInt(mode.slice(4)), 100);
      vars += '  ' + varName + ': ' + hsl.h + ' ' + hsl.s + '% ' + lVal + '% !important;\\n';
    }
  }

  // Determine color-scheme from bgMain lightness
  let colorScheme = '';
  if (theme.bgMain && __themeIsValidColor(theme.bgMain)) {
    const bgL = __themeHexToHSL(theme.bgMain).l;
    colorScheme = '  color-scheme: ' + (bgL < 50 ? 'dark' : 'light') + ' !important;\\n';
  }

  const block = vars + colorScheme;

  // Emit under every selector Claude Desktop uses for light/dark mode
  // so the theme wins regardless of which mode the user picks.
  const selectors = [
    ':root',
    'html[data-theme="light"]',
    'html[data-theme="dark"]',
    'html.light',
    'html.dark',
  ];
  let css = '';
  for (const sel of selectors) {
    css += sel + ' {\\n' + block + '}\\n';
  }
  // Also override @media queries
  css += '@media (prefers-color-scheme: light) { :root {\\n' + block + '} }\\n';
  css += '@media (prefers-color-scheme: dark)  { :root {\\n' + block + '} }\\n';

  // Direct hex overrides for specific elements
  if (theme.bgMain && __themeIsValidColor(theme.bgMain)) css += 'body { background: ' + theme.bgMain + ' !important; }\\n';
  if (__themeIsValidColor(theme.codeBg) || __themeIsValidColor(theme.codeText)) {
    css += 'pre, code, [class*="code-block"], [class*="codeBlock"], [class*="CodeBlock"], [class*="hljs"] { ';
    if (__themeIsValidColor(theme.codeBg)) css += 'background-color: ' + theme.codeBg + ' !important; ';
    if (__themeIsValidColor(theme.codeText)) css += 'color: ' + theme.codeText + ' !important; ';
    css += '}\\n';
  }
  if (__themeIsValidColor(theme.inlineCodeText)) css += ':not(pre) > code { color: ' + theme.inlineCodeText + ' !important; }\\n';
  if (__themeIsValidColor(theme.headingColor)) css += 'h1, h2, h3, h4, h5, h6 { color: ' + theme.headingColor + ' !important; }\\n';
  if (__themeIsValidColor(theme.boldColor)) css += 'strong, b { color: ' + theme.boldColor + ' !important; }\\n';
  if (__themeIsValidColor(theme.linkColor)) css += 'a { color: ' + theme.linkColor + ' !important; }\\n';
  if (__themeIsValidColor(theme.selectionBg)) css += '::selection { background: ' + theme.selectionBg + ' !important; }\\n';
  if (__themeIsValidColor(theme.userBubbleBg) || __themeIsValidColor(theme.userBubbleText)) {
    css += '[data-testid="user-message"] { ';
    if (__themeIsValidColor(theme.userBubbleBg)) css += 'background: ' + theme.userBubbleBg + ' !important; ';
    if (__themeIsValidColor(theme.userBubbleText)) css += 'color: ' + theme.userBubbleText + ' !important; ';
    css += '}\\n';
  }
  return css;
}

async function __themeApply(wc) {
  if (!wc || wc.isDestroyed()) return;
  if (__themeCSSKey) {
    try { await wc.removeInsertedCSS(__themeCSSKey); } catch(e) {}
    __themeCSSKey = null;
  }
  if (!__themeFs.existsSync(__THEME_FILE)) return;
  try {
    const raw = __themeFs.readFileSync(__THEME_FILE, 'utf-8');
    const theme = JSON.parse(raw);
    const css = __themeBuildCSS(theme);
    __themeCSSKey = await wc.insertCSS(css);
    const __themeName = typeof theme.name === 'string' ? theme.name.slice(0, 50).replace(/[^a-zA-Z0-9 _-]/g, '') : 'custom';
    console.log('[theme-loader] Applied theme: ' + __themeName);
  } catch(e) {
    console.error('[theme-loader] Failed:', e.message);
  }
}

// Hot-reload: watch theme.json for changes
__themeFs.watchFile(__THEME_FILE, { interval: 1000 }, (curr, prev) => {
  if (curr.mtimeMs === prev.mtimeMs) return;
  if (!pe || !pe.webContents || pe.webContents.isDestroyed()) return;
  console.log('[theme-loader] theme.json changed, reloading...');
  __themeApply(pe.webContents);
});
`;

// ── Patterns ──

const DOM_READY_ORIGINAL = 'o.webContents.on("dom-ready",()=>{nJ()})';
const DOM_READY_V03      = 'o.webContents.on("dom-ready",()=>{nJ();__themeApply(pe.webContents)})';
const SOURCEMAP_MARKER   = '\n//# sourceMappingURL=index.js.map';
const IDEMPOTENCY_MARKER = '__THEME_FILE';

// ── Helpers ──

function findClaudeDir() {
    const claudeBase = path.join(process.env.LOCALAPPDATA, 'AnthropicClaude');
    if (!fs.existsSync(claudeBase)) {
        throw new Error('Claude Desktop not found at ' + claudeBase);
    }
    const appDirs = fs.readdirSync(claudeBase)
        .filter(d => d.startsWith('app-') && fs.statSync(path.join(claudeBase, d)).isDirectory())
        .sort();
    const latest = appDirs.pop();
    if (!latest) {
        throw new Error('No app-* directory found in ' + claudeBase);
    }
    return path.join(claudeBase, latest);
}

function run(cmd, opts) {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts });
}

// ── Main ──

async function main() {
    const appDir = findClaudeDir();
    const resourcesDir = path.join(appDir, 'resources');
    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');
    const workDir = path.join(__dirname, '..', 'app_work');
    const outAsar = path.join(__dirname, '..', 'app_v03.asar');

    console.log('[1/6] Detected Claude: ' + path.basename(appDir));

    // Extract
    console.log('[2/6] Extracting app.asar...');
    if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true });
    }
    run('npx @electron/asar extract "' + asarPath + '" "' + workDir + '"');

    // Find index.js
    console.log('[3/6] Patching index.js...');
    const indexPath = path.join(workDir, '.vite', 'build', 'index.js');
    if (!fs.existsSync(indexPath)) {
        throw new Error('index.js not found at: ' + indexPath);
    }

    let content = fs.readFileSync(indexPath, 'utf8');

    // Idempotency check
    if (content.includes(IDEMPOTENCY_MARKER)) {
        console.log('  Theme loader already injected, skipping patch.');
    } else {
        // Point B: patch dom-ready handler
        if (!content.includes(DOM_READY_ORIGINAL)) {
            throw new Error('Cannot find dom-ready handler pattern. Claude Desktop version may have changed.');
        }
        content = content.replace(DOM_READY_ORIGINAL, DOM_READY_V03);
        console.log('  [Point B] Patched dom-ready handler');

        // Point A: append theme loader at module scope
        if (!content.includes(SOURCEMAP_MARKER)) {
            throw new Error('Cannot find sourceMappingURL marker in index.js');
        }
        content = content.replace(SOURCEMAP_MARKER, THEME_LOADER_CODE + SOURCEMAP_MARKER);
        console.log('  [Point A] Appended theme loader + fs.watchFile');

        fs.writeFileSync(indexPath, content);
    }

    // Repack
    console.log('[4/6] Repacking asar...');
    run('npx @electron/asar pack "' + workDir + '" "' + outAsar + '"');

    // Deploy
    console.log('[5/6] Deploying...');
    try {
        run('taskkill /IM claude.exe /F', { stdio: 'ignore' });
    } catch (e) {
        // Process may not be running
    }
    await new Promise(r => setTimeout(r, 2000));

    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(asarPath, backupPath);
        console.log('  Backup saved to ' + backupPath);
    }

    fs.copyFileSync(outAsar, asarPath);
    console.log('  Deployed!');

    // Clean up
    console.log('[6/6] Cleaning up...');
    fs.rmSync(workDir, { recursive: true });
    fs.unlinkSync(outAsar);

    // Relaunch
    const claudeExe = path.join(process.env.LOCALAPPDATA, 'AnthropicClaude', 'claude.exe');
    require('child_process').spawn(claudeExe, [], { detached: true, stdio: 'ignore' }).unref();

    console.log('\nDone! Claude Desktop relaunched with v0.3 theme loader.');
    console.log('Save your theme to: ' + path.join(require('os').homedir(), '.claude', 'theme.json'));
    console.log('Changes are picked up automatically — no restart needed.');
}

main().catch(err => {
    console.error('ERROR: ' + err.message);
    process.exit(1);
});
