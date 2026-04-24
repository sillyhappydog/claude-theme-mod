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

// Claude Theme Loader v0.4

// ── Claude Theme Loader v0.4 ──
// Reads ~/.claude/theme.json and applies CSS variables via a style tag.
// Watches for file changes and hot-reloads without restart.

const __themeFs = require('fs');
const __themePath = require('path');
const __themeOs = require('os');

const __THEME_FILE = __themePath.join(__themeOs.homedir(), '.claude', 'theme.json');

const __THEME_VAR_MAP = {
  bgMain:         [['--bg-000', 'hsl'], ['--bg-400', 'hsl'], ['--bg-500', 'hsl'], ['--claude-background-color', 'hex']],
  bgSidebar:      [['--bg-100', 'hsl'], ['--bg-200', 'hsl+3'], ['--bg-300', 'hsl+6'], ['--claude-foreground-color', 'hex-text']],
  textPrimary:    [['--text-000', 'hsl'], ['--text-100', 'hsl']],
  textSecondary:  [['--text-200', 'hsl'], ['--text-300', 'hsl']],
  textMuted:      [['--text-400', 'hsl'], ['--text-500', 'hsl']],
  accentPrimary:  [['--accent-brand', 'hsl'], ['--brand-000', 'hsl'], ['--brand-100', 'hsl'], ['--brand-200', 'hsl'], ['--accent-100', 'hsl'], ['--accent-200', 'hsl'], ['--accent-000', 'hsl'], ['--accent-900', 'hsl+40']],
  inlineCodeText: [['--danger-000', 'hsl'], ['--danger-100', 'hsl'], ['--danger-200', 'hsl'], ['--danger-900', 'hsl+40']],
  successColor:   [['--success-000', 'hsl'], ['--success-100', 'hsl'], ['--success-200', 'hsl'], ['--success-900', 'hsl+40']],
  borderColor:    [['--border-100', 'hsl'], ['--border-200', 'hsl'], ['--border-300', 'hsl'], ['--border-400', 'hsl']],
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

function __themeLighten(hex, amount) {
  // Lighten a hex color by adding to its lightness
  const hsl = __themeHexToHSL(hex);
  const l = Math.min(hsl.l + amount, 100);
  // HSL to hex conversion
  const h = hsl.h / 360, s = hsl.s / 100, lv = l / 100;
  let r, g, b;
  if (s === 0) { r = g = b = lv; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = lv < 0.5 ? lv * (1 + s) : lv + s - lv * s;
    const p = 2 * lv - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function __themeIsValidColor(val) {
  if (typeof val !== 'string') return false;
  // Allow #RGB, #RRGGBB, #RRGGBBAA (3, 4, 6, or 8 hex digits)
  return /^#[0-9a-fA-F]{3,8}$/.test(val);
}

// Returns [[varName, value], ...] pairs for inline style injection
function __themeBuildVarPairs(theme) {
  var pairs = [];
  for (const [key, mappings] of Object.entries(__THEME_VAR_MAP)) {
    if (!theme[key] || !__themeIsValidColor(theme[key])) continue;
    const hsl = __themeHexToHSL(theme[key]);
    for (const [varName, mode] of mappings) {
      if (mode === 'hex') {
        // Output raw hex value (e.g. --claude-background-color: #0A0A0A)
        pairs.push([varName, theme[key]]);
      } else if (mode === 'hex-text') {
        // Output textPrimary hex value (e.g. --claude-foreground-color: #00FF41)
        if (theme.textPrimary && __themeIsValidColor(theme.textPrimary)) {
          pairs.push([varName, theme.textPrimary]);
        }
      } else {
        let lVal = hsl.l;
        if (mode.startsWith('hsl+')) {
          var offset = parseInt(mode.slice(4), 10);
          lVal = hsl.l <= 50 ? Math.min(hsl.l + offset, 100) : Math.max(hsl.l - offset, 0);
        }
        pairs.push([varName, hsl.h + ' ' + hsl.s + '% ' + lVal + '%']);
      }
    }
  }
  return pairs;
}

async function __themeApply(wc) {
  if (!wc || wc.isDestroyed()) return;
  if (!__themeFs.existsSync(__THEME_FILE)) {
    // Remove all theme properties from inline style
    await wc.executeJavaScript(
      "(function(){" +
      "if(typeof document==='undefined')return;" +
      "var s=document.documentElement.style;" +
      "for(var i=s.length-1;i>=0;i--){var p=s[i];if(p.startsWith('--bg-')||p.startsWith('--text-')||p.startsWith('--border-')||p.startsWith('--accent-')||p.startsWith('--brand-'))s.removeProperty(p);}" +
      "s.removeProperty('color-scheme');" +
      "if(document.body)document.body.style.removeProperty('background');" +
      "var dc=document.querySelector('.dframe-content');if(dc)dc.style.removeProperty('background-color');" +
      "var ds=document.querySelector('.dframe-sidebar');if(ds)ds.style.removeProperty('background-color');" +
      "var _sel=document.getElementById('__theme-override-styles');if(_sel)_sel.remove();" +
      "if(window.__themeObs){window.__themeObs.disconnect();delete window.__themeObs;}" +
      "if(window.__themeInterval){clearInterval(window.__themeInterval);delete window.__themeInterval;}" +
      "})();"
    ).catch(function(){});
    return;
  }
  try {
    const raw = __themeFs.readFileSync(__THEME_FILE, 'utf-8');
    const theme = JSON.parse(raw);
    const pairs = __themeBuildVarPairs(theme);
    if (!pairs.length) return;

    // Determine color-scheme
    var cs = 'light';
    if (theme.bgMain && __themeIsValidColor(theme.bgMain)) {
      cs = __themeHexToHSL(theme.bgMain).l < 50 ? 'dark' : 'light';
    }

    // Build setProperty calls for documentElement.style (inline !important)
    var script = "(function(){" +
      "if(typeof document==='undefined')return false;" +
      "var s=document.documentElement.style;";
    for (var i = 0; i < pairs.length; i++) {
      script += "s.setProperty(" + JSON.stringify(pairs[i][0]) + "," + JSON.stringify(pairs[i][1]) + ",'important');";
    }
    script += "s.setProperty('color-scheme'," + JSON.stringify(cs) + ",'important');";
    // body background
    if (theme.bgMain && __themeIsValidColor(theme.bgMain)) {
      script += "if(document.body)document.body.style.setProperty('background'," + JSON.stringify(theme.bgMain) + ",'important');";
    }
    // Desktop frame elements
    var bgMainHex = theme.bgMain && __themeIsValidColor(theme.bgMain) ? JSON.stringify(theme.bgMain) : 'null';
    var bgSidebarHex = theme.bgSidebar && __themeIsValidColor(theme.bgSidebar) ? JSON.stringify(theme.bgSidebar) : 'null';
    script += "var _bgM=" + bgMainHex + ",_bgS=" + bgSidebarHex + ";";
    script += "var dc=document.querySelector('.dframe-content');if(dc&&_bgM)dc.style.setProperty('background-color',_bgM,'important');";
    script += "var ds=document.querySelector('.dframe-sidebar');if(ds&&_bgS)ds.style.setProperty('background-color',_bgS,'important');";
    // Style tag injection: override Tailwind utility classes directly
    // This catches elements (header, disclaimer bar, settings bg) where
    // CSS variable overrides alone may not propagate in the Desktop shell.
    var bgMainHSL = theme.bgMain && __themeIsValidColor(theme.bgMain) ? __themeHexToHSL(theme.bgMain) : null;
    var bgSidebarHSL = theme.bgSidebar && __themeIsValidColor(theme.bgSidebar) ? __themeHexToHSL(theme.bgSidebar) : null;
    if (bgMainHSL || bgSidebarHSL) {
      var css = '';
      if (bgSidebarHSL) {
        // --bg-100 is the page base background in claude.ai
        var h1 = bgSidebarHSL.h + ' ' + bgSidebarHSL.s + '% ' + bgSidebarHSL.l + '%';
        css += '.bg-bg-100{background-color:hsl(' + h1 + ')!important}';
        css += '.bg-bg-100\\\\/20{background-color:hsl(' + h1 + ' / 0.2)!important}';
        css += '.bg-bg-100\\\\/30{background-color:hsl(' + h1 + ' / 0.3)!important}';
        css += '.bg-bg-100\\\\/40{background-color:hsl(' + h1 + ' / 0.4)!important}';
        css += '.bg-bg-100\\\\/50{background-color:hsl(' + h1 + ' / 0.5)!important}';
        css += '.bg-bg-100\\\\/60{background-color:hsl(' + h1 + ' / 0.6)!important}';
        css += '.bg-bg-100\\\\/70{background-color:hsl(' + h1 + ' / 0.7)!important}';
        css += '.bg-bg-100\\\\/80{background-color:hsl(' + h1 + ' / 0.8)!important}';
        css += '.from-bg-100{--tw-gradient-from:hsl(' + h1 + ')!important;--tw-gradient-to:hsl(' + h1 + ' / 0)!important}';
        css += '.via-bg-100{--tw-gradient-stops:var(--tw-gradient-from),hsl(' + h1 + ') var(--tw-gradient-via-position),var(--tw-gradient-to)!important}';
        css += '.via-bg-100\\\\/60{--tw-gradient-stops:var(--tw-gradient-from),hsl(' + h1 + ' / 0.6) var(--tw-gradient-via-position),var(--tw-gradient-to)!important}';
        css += '.via-bg-100\\\\/75{--tw-gradient-stops:var(--tw-gradient-from),hsl(' + h1 + ' / 0.75) var(--tw-gradient-via-position),var(--tw-gradient-to)!important}';
        css += '.to-bg-100\\\\/0{--tw-gradient-to:hsl(' + h1 + ' / 0)!important}';
      }
      // Code block background color
      var codeBgVal = theme.codeBg || '';
      if (codeBgVal) {
        css += '.bg-bg-000\\/50{background-color:' + codeBgVal + '!important;background:' + codeBgVal + '!important}';
        css += '[class*="code-block"],[class*="code-block"]>*,[class*="code-block"] div,[class*="code-block"] pre{background-color:' + codeBgVal + '!important;background:' + codeBgVal + '!important}';
      }
      // Inline code: remove border
      css += '.ReactMarkdown code,div.ProseMirror>p>code{border:none!important}';
      if (bgMainHSL) {
        var h0 = bgMainHSL.h + ' ' + bgMainHSL.s + '% ' + bgMainHSL.l + '%';
        css += '.bg-bg-000{background-color:hsl(' + h0 + ')!important}';
        css += '.bg-bg-000\\\\/90{background-color:hsl(' + h0 + ' / 0.9)!important}';
      }
      script += "var _sid='__theme-override-styles';";
      script += "var _sel=document.getElementById(_sid);";
      script += "if(!_sel){_sel=document.createElement('style');_sel.id=_sid;document.head.appendChild(_sel);}";
      script += "_sel.textContent=" + JSON.stringify(css) + ";";
    }

    // Direct element targeting: header, disclaimer, gradient overlay
    script += "function __themeFixEls(){";
    script += "var dc=document.querySelector('.dframe-content');if(dc&&_bgM)dc.style.setProperty('background-color',_bgM,'important');";
    script += "var ds=document.querySelector('.dframe-sidebar');if(ds&&_bgS)ds.style.setProperty('background-color',_bgS,'important');";
    // Sticky header
    script += "document.querySelectorAll('header.sticky,header[class*=\\"sticky\\"]').forEach(function(h){if(_bgM)h.style.setProperty('background-color',_bgM,'important');});";
    // Gradient overlay behind header
    script += "document.querySelectorAll('[class*=\\"from-bg-100\\"][class*=\\"gradient\\"]').forEach(function(g){g.style.setProperty('background-image','none','important');});";
    // Disclaimer bar
    script += "document.querySelectorAll('div.text-center.text-xs').forEach(function(d){if(d.textContent&&d.textContent.indexOf('make mistakes')!==-1&&_bgM)d.style.setProperty('background-color',_bgM,'important');});";
    // Code block background: walk UP from pre and force all ancestors' backgrounds
    var codeBgVal2 = (theme.codeBg) ? JSON.stringify(theme.codeBg) : 'null';
    script += "var _cBg=" + codeBgVal2 + ";";
    script += "if(_cBg){document.querySelectorAll('pre.code-block__code').forEach(function(p){";
    script += "p.style.setProperty('background',_cBg,'important');";
    script += "var el=p.parentElement;for(var i=0;i<5&&el;i++){";
    script += "var bg=getComputedStyle(el).backgroundColor;";
    script += "if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'){el.style.setProperty('background-color',_cBg,'important');el.style.setProperty('background',_cBg,'important');el.style.setProperty('border-color','transparent','important');}";
    script += "el=el.parentElement;}});}";
    // Inline code: remove border
    script += "document.querySelectorAll('code').forEach(function(c){if(!c.closest('pre')){c.style.setProperty('border-color','transparent','important');}});";
    script += "}";
    script += "__themeFixEls();";
    // Periodic re-apply for elements that resist MutationObserver (e.g., Shiki code blocks)
    script += "if(window.__themeInterval)clearInterval(window.__themeInterval);";
    script += "window.__themeInterval=setInterval(__themeFixEls,2000);";
    // MutationObserver: re-apply on DOM changes
    script += "if(window.__themeObs)window.__themeObs.disconnect();";
    script += "window.__themeObs=new MutationObserver(function(){__themeFixEls();});";
    script += "window.__themeObs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-mode','style']});";
    script += "return true;})();"

    var ok = await wc.executeJavaScript(script).catch(function(){ return false; });
    if (!ok) return;
    const __themeName = typeof theme.name === 'string' ? theme.name.slice(0, 50).replace(/[^a-zA-Z0-9 _-]/g, '') : 'custom';
    console.log('[theme-loader] Applied theme: ' + __themeName + ' (wc:' + wc.id + ', vars: ' + pairs.length + ')');
  } catch(e) {
    console.error('[theme-loader] Failed:', e.message);
  }
}

// Apply to both content view (pe) and shell view (Qt)
function __themeApplyAll() {
  if (pe && pe.webContents && !pe.webContents.isDestroyed()) __themeApply(pe.webContents);
  if (typeof Qt !== 'undefined' && Qt && Qt.webContents && !Qt.webContents.isDestroyed()) __themeApply(Qt.webContents);
}

// Hot-reload: watch theme.json for changes
__themeFs.watchFile(__THEME_FILE, { interval: 1000 }, (curr, prev) => {
  if (curr.mtimeMs === prev.mtimeMs) return;
  console.log('[theme-loader] theme.json changed, reloading...');
  __themeApplyAll();
});
`;

// ── Patterns ──

const DOM_READY_ORIGINAL = 'o.webContents.on("dom-ready",()=>{nJ()})';
const DOM_READY_V03      = 'o.webContents.on("dom-ready",()=>{nJ();__themeApplyAll()})';
const SOURCEMAP_MARKER   = '\n//# sourceMappingURL=index.js.map';

// GLt: hardcoded background color function that overrides theme on mode switch
const GLT_ORIGINAL = 'function GLt(e,A){return e==="dark"?"#131312":A?"#ffffff":"#f5f5f5"}';
const GLT_THEMED   = 'function GLt(e,A){try{var _tf=require("path").join(require("os").homedir(),".claude","theme.json");var _td=JSON.parse(require("fs").readFileSync(_tf,"utf-8"));if(_td.bgMain)return _td.bgMain}catch(_e){}return e==="dark"?"#131312":A?"#ffffff":"#f5f5f5"}';

// QyA: BrowserWindow initial background color
const QYA_ORIGINAL = 'function QyA(){return pA.nativeTheme.shouldUseDarkColors?"#1f1f1e":"#fdfdfc"}';
const QYA_THEMED   = 'function QyA(){try{var _tf=require("path").join(require("os").homedir(),".claude","theme.json");var _td=JSON.parse(require("fs").readFileSync(_tf,"utf-8"));if(_td.bgMain)return _td.bgMain}catch(_e){}return pA.nativeTheme.shouldUseDarkColors?"#1f1f1e":"#fdfdfc"}';

// Content view setBackgroundColor
const SETBG_ORIGINAL = 'o.setBackgroundColor("#00000000")';
const SETBG_THEMED   = 'o.setBackgroundColor((function(){try{var _td=JSON.parse(require("fs").readFileSync(require("path").join(require("os").homedir(),".claude","theme.json"),"utf-8"));return _td.bgMain||"#00000000"}catch(_e){return"#00000000"}})())';

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
    // Restore clean base from backup so we always patch from unmodified source.
    // The backup is never overwritten — it was created on the very first run.
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, asarPath);
        console.log('[2/6] Restored clean base from backup');
    } else {
        console.log('[2/6] First run — no backup yet');
    }
    if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true });
    }
    console.log('     Extracting app.asar...');
    run('npx @electron/asar extract "' + asarPath + '" "' + workDir + '"');

    // Find index.js
    console.log('[3/6] Patching index.js...');
    const indexPath = path.join(workDir, '.vite', 'build', 'index.js');
    if (!fs.existsSync(indexPath)) {
        throw new Error('index.js not found at: ' + indexPath);
    }

    let content = fs.readFileSync(indexPath, 'utf8');

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

    // Point C: patch GLt background color function to read theme.json
    if (content.includes(GLT_ORIGINAL)) {
        content = content.replace(GLT_ORIGINAL, GLT_THEMED);
        console.log('  [Point C] Patched GLt background color function');
    } else {
        console.log('  [Point C] GLt pattern not found (may have changed)');
    }

    // Point D: patch QyA BrowserWindow background color
    if (content.includes(QYA_ORIGINAL)) {
        content = content.replace(QYA_ORIGINAL, QYA_THEMED);
        console.log('  [Point D] Patched QyA BrowserWindow background color');
    } else {
        console.log('  [Point D] QyA pattern not found (may have changed)');
    }

    // Point E: patch content view setBackgroundColor
    if (content.includes(SETBG_ORIGINAL)) {
        content = content.replace(SETBG_ORIGINAL, SETBG_THEMED);
        console.log('  [Point E] Patched setBackgroundColor');
    } else {
        console.log('  [Point E] setBackgroundColor pattern not found (may have changed)');
    }

    fs.writeFileSync(indexPath, content);

    // Patch index.html files — shell inline <style> with claude-* variables
    const themeFile = path.join(require('os').homedir(), '.claude', 'theme.json');
    let shellBg = '#0A0A0A';
    let shellFg = '#00FF41';
    if (fs.existsSync(themeFile)) {
        try {
            const themeData = JSON.parse(fs.readFileSync(themeFile, 'utf8'));
            if (themeData.bgMain) shellBg = themeData.bgMain;
            if (themeData.textPrimary) shellFg = themeData.textPrimary;
        } catch (e) {}
    }
    const htmlFiles = [
        path.join(workDir, '.vite', 'renderer', 'main_window', 'index.html'),
        path.join(workDir, '.vite', 'renderer', 'buddy_window', 'index.html'),
        path.join(workDir, '.vite', 'renderer', 'about_window', 'index.html'),
        path.join(workDir, '.vite', 'renderer', 'find_in_page', 'index.html'),
        path.join(workDir, '.vite', 'renderer', 'quick_window', 'index.html'),
    ];
    // Build comprehensive theme override CSS block for shell HTML
    let shellSidebar = shellBg;
    let shellBorder = '#0A3A0A';
    let shellTextMuted = '#008F26';
    if (fs.existsSync(themeFile)) {
        try {
            const td = JSON.parse(fs.readFileSync(themeFile, 'utf8'));
            if (td.bgSidebar) shellSidebar = td.bgSidebar;
            if (td.borderColor) shellBorder = td.borderColor;
            if (td.textMuted) shellTextMuted = td.textMuted;
        } catch (e) {}
    }
    // Determine if theme is dark (lightness < 50)
    const shellIsDark = (function(hex) {
        const r = parseInt(hex.slice(1,3),16)/255;
        const g = parseInt(hex.slice(3,5),16)/255;
        const b = parseInt(hex.slice(5,7),16)/255;
        return (Math.max(r,g,b)+Math.min(r,g,b))/2 < 0.5;
    })(shellBg);

    const themeOverrideCSS = '<style id="__theme-shell-override">\n' +
        '  :root, .light, .dark {\n' +
        '    color-scheme: ' + (shellIsDark ? 'dark' : 'light') + ' !important;\n' +
        '  }\n' +
        '  body, html {\n' +
        '    background-color: ' + shellBg + ' !important;\n' +
        '    background: ' + shellBg + ' !important;\n' +
        '    color: ' + shellFg + ' !important;\n' +
        '  }\n' +
        '  * { border-color: ' + shellBorder + ' !important; }\n' +
        '  .nc-drag { background: transparent !important; }\n' +
        '</style>\n';

    let htmlPatched = 0;
    for (const htmlPath of htmlFiles) {
        if (!fs.existsSync(htmlPath)) continue;
        let html = fs.readFileSync(htmlPath, 'utf8');
        // Replace claude-* CSS variables
        html = html.replace(/--claude-background-color:\s*[^;]+;/g, '--claude-background-color: ' + shellBg + ';');
        html = html.replace(/--claude-foreground-color:\s*[^;]+;/g, '--claude-foreground-color: ' + shellFg + ';');
        // Switch body class to dark when theme is dark
        if (shellIsDark) {
            html = html.replace('<body class="light">', '<body class="dark" style="background:' + shellBg + '">');
        }
        // Inject theme override CSS block before </head>
        if (html.includes('</head>')) {
            html = html.replace('</head>', themeOverrideCSS + '</head>');
        }
        fs.writeFileSync(htmlPath, html);
        htmlPatched++;
    }
    if (htmlPatched) console.log('  [Shell] Patched ' + htmlPatched + ' index.html file(s) (body: ' + (shellIsDark ? 'dark' : 'light') + ')');

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

    console.log('\nDone! Claude Desktop relaunched with v0.4 theme loader.');
    console.log('Save your theme to: ' + path.join(require('os').homedir(), '.claude', 'theme.json'));
    console.log('Changes are picked up automatically — no restart needed.');
}

main().catch(err => {
    console.error('ERROR: ' + err.message);
    process.exit(1);
});
