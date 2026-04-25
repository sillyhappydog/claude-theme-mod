// cdp_full_theme.js v0.7 — Refactored: CSS-only, no polling
// All styling via CSS rules + CSS variables. No setInterval, no DOM iteration.
// Only JS: one-time setup + MutationObserver for body class (mode independence).
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || 9222;
const THEME_FILE = path.join(require('os').homedir(), '.claude', 'theme.json');
const theme = JSON.parse(fs.readFileSync(THEME_FILE, 'utf-8').replace(/^\uFEFF/, ''));

// ── Helpers ──────────────────────────────────────────────────────────

function hexToHSL(hex) {
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

function resolveMode(t) {
  if (t.mode === 'light' || t.mode === 'dark') return t.mode;
  return hexToHSL(t.bgMain || '#000000').l < 50 ? 'dark' : 'light';
}

const themeMode = resolveMode(theme);
console.log(`Theme: "${theme.name || 'unnamed'}" | Mode: ${themeMode}`);

// ── VAR_MAP ─────────────────────────────────────────────────────────

const VAR_MAP = {
  bgMain:         [['--bg-000','hsl'],['--bg-400','hsl'],['--bg-500','hsl'],['--claude-background-color','hex']],
  bgSidebar:      [['--bg-100','hsl'],['--bg-200','hsl+3'],['--bg-300','hsl+6'],['--claude-foreground-color','hex-text']],
  textPrimary:    [['--text-000','hsl'],['--text-100','hsl']],
  textSecondary:  [['--text-200','hsl'],['--text-300','hsl']],
  textMuted:      [['--text-400','hsl'],['--text-500','hsl']],
  accentPrimary:  [['--accent-brand','hsl'],['--brand-000','hsl'],['--brand-100','hsl'],['--brand-200','hsl'],['--accent-100','hsl'],['--accent-200','hsl'],['--accent-000','hsl'],['--accent-900','hsl+40']],
  inlineCodeText: [['--danger-000','hsl'],['--danger-100','hsl'],['--danger-200','hsl'],['--danger-900','hsl+40']],
  successColor:   [['--success-000','hsl'],['--success-100','hsl'],['--success-200','hsl'],['--success-900','hsl+40']],
  borderColor:    [['--border-100','hsl'],['--border-200','hsl'],['--border-300','hsl'],['--border-400','hsl']],
};

// Build CSS variable pairs
const pairs = [];
for (const [key, mappings] of Object.entries(VAR_MAP)) {
  if (!theme[key] || !/^#[0-9a-fA-F]{3,8}$/.test(theme[key])) continue;
  const hsl = hexToHSL(theme[key]);
  for (const [varName, mode] of mappings) {
    if (mode === 'hex') { pairs.push([varName, theme[key]]); }
    else if (mode === 'hex-text') { if (theme.textPrimary) pairs.push([varName, theme.textPrimary]); }
    else {
      let lVal = hsl.l;
      if (mode.startsWith('hsl+')) {
        const offset = parseInt(mode.slice(4), 10);
        lVal = hsl.l <= 50 ? Math.min(hsl.l + offset, 100) : Math.max(hsl.l - offset, 0);
      }
      pairs.push([varName, `${hsl.h} ${hsl.s}% ${lVal}%`]);
    }
  }
}

// Effect config
const accentHex = theme.accentPrimary || theme.textPrimary || '#00FF41';
const codeHex = theme.inlineCodeText || theme.textSecondary || '#FFB830';
const glassEnabled = theme.glassEffect !== false && themeMode === 'dark';
const glowEnabled = theme.glowEffect !== false && themeMode === 'dark';

// ── Content injection script ────────────────────────────────────────

function buildContentScript() {
  const bgMainHSL = theme.bgMain ? hexToHSL(theme.bgMain) : null;
  const bgSidebarHSL = theme.bgSidebar ? hexToHSL(theme.bgSidebar) : null;
  const bgMain = theme.bgMain || '#000000';
  const bgSidebar = theme.bgSidebar || bgMain;

  // ── Base CSS rules (all styling via stylesheet, no inline iteration) ──
  let css = '';

  // Media query override: force theme vars in BOTH light and dark prefers-color-scheme
  // Electron's nativeTheme changes prefers-color-scheme, which Tailwind @media rules respond to.
  // We must override in both media queries to prevent Appearance toggle from changing colors.
  const varBlock = pairs.map(p => `${p[0]}:${p[1]}!important`).join(';');
  css += `@media(prefers-color-scheme:dark){:root{${varBlock};color-scheme:${themeMode}!important}}`;
  css += `@media(prefers-color-scheme:light){:root{${varBlock};color-scheme:${themeMode}!important}}`;

  // Background overrides
  if (bgSidebarHSL) css += `.bg-bg-100{background-color:hsl(${bgSidebarHSL.h} ${bgSidebarHSL.s}% ${bgSidebarHSL.l}%)!important}`;
  if (bgMainHSL) css += `.bg-bg-000{background-color:hsl(${bgMainHSL.h} ${bgMainHSL.s}% ${bgMainHSL.l}%)!important}`;

  // Inline code: remove border/bg (was el.style.setProperty in __themeFixEls)
  css += '.standard-markdown code:not(pre code){border:none!important;background:transparent!important}';

  // Code block pre transparency
  css += 'pre.code-block__code,pre.code-block__code>code{background:transparent!important;background-color:transparent!important}';

  // Code block wrapper bg
  if (theme.codeBg) css += `.bg-bg-000\\/50{background-color:${theme.codeBg}!important;background:${theme.codeBg}!important}`;

  // Desktop frame elements (was inline style in __themeFixEls)
  css += `.dframe-content{background-color:${bgMain}!important}`;
  css += `.dframe-sidebar{background-color:${bgSidebar}!important}`;

  // Disclaimer bar ("Claude is AI and can make mistakes") — uses bg-bg-100 (sidebar color), force to bgMain
  css += `.text-center.text-xs.py-2.bg-bg-100{background-color:${bgMain}!important}`;

  // Title/nav bar strip — df-pill-indicator and any remaining header elements
  css += `.df-pill-indicator{background-color:${bgMain}!important}`;

  // Gradient fade overrides — Tailwind's from-bg-100/via-bg-100 uses default #FDFDFC
  // Override background-image directly since Tailwind's internal variable chain is too complex
  if (bgMainHSL) {
    const hslMain = `hsl(${bgMainHSL.h} ${bgMainHSL.s}% ${bgMainHSL.l}%)`;
    // Thinking "Show more" fade (top-to-bottom)
    css += `[class*="bg-gradient-to-b"][class*="from-bg-100"]{background-image:linear-gradient(to bottom,${hslMain} 50%,${hslMain.replace(')',',0.75)')} 75%,${hslMain.replace(')',',0)')})!important}`;
    // Bottom fade (bottom-to-top) 
    css += `[class*="bg-gradient-to-t"][class*="from-bg-100"]{background-image:linear-gradient(to top,${hslMain},transparent)!important}`;
  }

  // ── Effects CSS rules ──
  let cssEffects = '';

  if (glassEnabled) {
    const {r:ar, g:ag, b:ab} = hexToRgb(accentHex);
    const cbg = theme.codeBg || bgMain;
    cssEffects += `[class*="group/copy"]{`;
    cssEffects += `background:linear-gradient(180deg,rgba(${ar},${ag},${ab},0.08) 0%,rgba(${ar},${ag},${ab},0.04) 100%),${cbg}!important;`;
    cssEffects += `backdrop-filter:brightness(1.15)!important;-webkit-backdrop-filter:brightness(1.15)!important;`;
    cssEffects += `border-top:1px solid rgba(${ar},${ag},${ab},0.15)!important;`;
    cssEffects += `border-left:1px solid rgba(${ar},${ag},${ab},0.06)!important;`;
    cssEffects += `border-right:1px solid rgba(${ar},${ag},${ab},0.04)!important;`;
    cssEffects += `border-bottom:1px solid rgba(${ar},${ag},${ab},0.03)!important;`;
    cssEffects += `box-shadow:0 0 15px rgba(${ar},${ag},${ab},0.06),inset 0 1px 0 rgba(${ar},${ag},${ab},0.1)!important}`;
  }

  if (glowEnabled) {
    const {r:cr, g:cg, b:cb} = hexToRgb(codeHex);
    cssEffects += `.standard-markdown code:not(pre code){color:${codeHex}!important;`;
    cssEffects += `text-shadow:0 0 8px rgba(${cr},${cg},${cb},0.5),0 0 2px rgba(${cr},${cg},${cb},0.8)!important}`;
  }

  // Serialize for injection
  const pairsJSON = JSON.stringify(pairs);
  const modeJSON = JSON.stringify(themeMode);
  const cssJSON = JSON.stringify(css);
  const cssEffectsJSON = JSON.stringify(cssEffects);
  const bgMainJSON = JSON.stringify(bgMain);

  // ── Injection script: minimal JS, no polling ──
  return `(function(){
    var MODE = ${modeJSON};
    var BG_MAIN = ${bgMainJSON};
    var PAIRS = ${pairsJSON};
    var CSS_RULES = ${cssJSON};
    var CSS_EFFECTS = ${cssEffectsJSON};

    // 1. Force mode on all relevant attributes
    function forceMode() {
      // body class: light/dark
      if (document.body) {
        var cl = document.body.classList;
        if (MODE === 'dark') { cl.remove('light'); cl.add('dark'); }
        else { cl.remove('dark'); cl.add('light'); }
      }
      // html data-mode: the REAL dark mode switch for Content
      var dm = document.documentElement.getAttribute('data-mode');
      if (dm !== MODE) {
        document.documentElement.setAttribute('data-mode', MODE);
      }
    }
    forceMode();

    // 2. CSS variables on :root (one-time)
    var s = document.documentElement.style;
    for (var i = 0; i < PAIRS.length; i++) {
      s.setProperty(PAIRS[i][0], PAIRS[i][1], 'important');
    }
    s.setProperty('color-scheme', MODE, 'important');
    if (document.body) document.body.style.setProperty('background', BG_MAIN, 'important');

    // 3. Style tags (all visual styling via CSS rules)
    function setStyleTag(id, content) {
      var el = document.getElementById(id);
      if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
      el.textContent = content;
    }
    setStyleTag('__theme-override-styles', CSS_RULES);
    setStyleTag('__theme-effects-styles', CSS_EFFECTS);

    // 4. Mode interception — watch data-mode on <html> AND class on <body>
    // Appearance toggle sets: <html data-mode="dark"> + body class changes
    // Both must be intercepted and forced back to theme mode
    function reapplyAll() {
      forceMode();
      for (var i = 0; i < PAIRS.length; i++) {
        s.setProperty(PAIRS[i][0], PAIRS[i][1], 'important');
      }
      s.setProperty('color-scheme', MODE, 'important');
    }

    // 4a. Watch <html> for data-mode attribute changes (PRIMARY dark mode switch)
    if (window.__themeHtmlObs) window.__themeHtmlObs.disconnect();
    window.__themeHtmlObs = new MutationObserver(function(mutations) {
      for (var m = 0; m < mutations.length; m++) {
        if (mutations[m].attributeName === 'data-mode') {
          var current = document.documentElement.getAttribute('data-mode');
          if (current !== MODE) {
            reapplyAll();
          }
        }
        if (mutations[m].attributeName === 'style') {
          // CSS variables may have been overwritten
          var bg = s.getPropertyValue(PAIRS[0][0]);
          if (bg !== PAIRS[0][1]) {
            reapplyAll();
          }
        }
      }
    });
    window.__themeHtmlObs.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-mode', 'style']
    });

    // 4b. Watch <body> for class changes (secondary)
    if (window.__themeModeObs) window.__themeModeObs.disconnect();
    window.__themeModeObs = new MutationObserver(function(mutations) {
      for (var m = 0; m < mutations.length; m++) {
        if (mutations[m].attributeName === 'class' && !document.body.classList.contains(MODE)) {
          reapplyAll();
        }
      }
    });
    if (document.body) {
      window.__themeModeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    // 5. Gradient inline overrides — Tailwind's gradient chain ignores CSS rule !important
    // Must use inline style.setProperty on each element
    var HSL_MAIN = '${bgMainHSL ? `${bgMainHSL.h} ${bgMainHSL.s}% ${bgMainHSL.l}%` : '0 0% 99%'}';
    function fixGradients() {
      var solid = 'hsl(' + HSL_MAIN + ')';
      var semi = 'hsl(' + HSL_MAIN + ' / 0.75)';
      var clear = 'hsl(' + HSL_MAIN + ' / 0)';
      var gradDown = 'linear-gradient(to bottom,' + solid + ' 50%,' + semi + ' 75%,' + clear + ')';
      var gradUp = 'linear-gradient(to top,' + solid + ',transparent)';
      var fromEls = document.querySelectorAll('[class*="from-bg-100"]');
      for (var i = 0; i < fromEls.length; i++) {
        var cls = fromEls[i].className || '';
        if (cls.indexOf('bg-gradient-to-b') > -1) {
          fromEls[i].style.setProperty('background-image', gradDown, 'important');
        } else if (cls.indexOf('bg-gradient-to-t') > -1) {
          fromEls[i].style.setProperty('background-image', gradUp, 'important');
        }
      }
    }
    fixGradients();

    // 6. Cleanup legacy polling (from previous v0.6 injections)
    if (window.__themeInterval) { clearInterval(window.__themeInterval); delete window.__themeInterval; }
    if (window.__themeObs) { window.__themeObs.disconnect(); delete window.__themeObs; }

    return 'v0.7 Content [' + MODE + '] glass:${glassEnabled} glow:${glowEnabled} (no polling)';
  })()`;
}

// ── Shell injection script ──────────────────────────────────────────

function buildShellScript() {
  const bg = theme.bgMain || '#000000';
  const text = theme.textPrimary || '#FFFFFF';
  const modeJSON = JSON.stringify(themeMode);

  // Shell CSS: override all backgrounds via rule instead of querySelectorAll('*')
  const shellCss = `*{background-color:${bg}!important}`
    + `body{color:${text}!important}`;

  return `(function(){
    var MODE = ${modeJSON};

    // Force body class: light/dark AND darkTheme/lightTheme
    function forceShellMode() {
      if (!document.body) return;
      var cl = document.body.classList;
      if (MODE === 'dark') {
        cl.remove('light'); cl.add('dark');
        cl.remove('lightTheme'); cl.add('darkTheme');
      } else {
        cl.remove('dark'); cl.add('light');
        cl.remove('darkTheme'); cl.add('lightTheme');
      }
    }
    forceShellMode();

    // CSS variables
    var s = document.documentElement.style;
    s.setProperty('--claude-background-color', ${JSON.stringify(bg)}, 'important');
    s.setProperty('--claude-foreground-color', ${JSON.stringify(text)}, 'important');
    s.setProperty('color-scheme', MODE, 'important');

    // Style tag (replaces querySelectorAll('*') iteration)
    var el = document.getElementById('__theme-shell-styles');
    if (!el) { el = document.createElement('style'); el.id = '__theme-shell-styles'; document.head.appendChild(el); }
    el.textContent = ${JSON.stringify(shellCss)};

    // Mode observer — catch darkTheme/lightTheme AND dark/light class changes
    if (window.__shellModeObs) window.__shellModeObs.disconnect();
    window.__shellModeObs = new MutationObserver(function() {
      if (!document.body) return;
      var cl = document.body.classList;
      var needsFix = false;
      if (MODE === 'light' && cl.contains('darkTheme')) needsFix = true;
      if (MODE === 'dark' && cl.contains('lightTheme')) needsFix = true;
      if (!cl.contains(MODE)) needsFix = true;
      if (needsFix) forceShellMode();
    });
    if (document.body) {
      window.__shellModeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    return 'v0.7 Shell [' + MODE + ']';
  })()`;
}

// ── hexToRgb (used by glass/glow CSS builders) ──────────────────────

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16),
  };
}

// ── CDP multi-target injection ──────────────────────────────────────

async function getTargets() {
  const resp = await fetch(`http://localhost:${CDP_PORT}/json`);
  return await resp.json();
}

function injectViaWS(targetId, script, label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${CDP_PORT}/devtools/page/${targetId}`);
    const timer = setTimeout(() => { ws.close(); reject(new Error(`${label}: timeout`)); }, 10000);
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script } }));
    });
    ws.on('message', (data) => {
      const r = JSON.parse(data.toString());
      if (r.id === 1) {
        clearTimeout(timer);
        const err = r.result?.exceptionDetails;
        if (err) console.error(`${label}: EXCEPTION`, JSON.stringify(err, null, 2));
        else console.log(`${label}: ${r.result?.result?.value}`);
        ws.close();
        resolve(r.result?.result?.value);
      }
    });
    ws.on('error', (e) => { clearTimeout(timer); reject(new Error(`${label}: ${e.message}`)); });
  });
}

(async () => {
  try {
    const targets = await getTargets();
    const shell = targets.find(t => t.url.includes('index.html'));
    const content = targets.find(t => t.url.includes('claude.ai'));

    if (!shell && !content) {
      console.error('No targets found. Is Claude Desktop running with --remote-debugging-port=9222?');
      process.exit(1);
    }

    if (shell) await injectViaWS(shell.id, buildShellScript(), 'Shell');
    else console.warn('Shell target not found — skipping');

    if (content) await injectViaWS(content.id, buildContentScript(), 'Content');
    else console.warn('Content target not found — skipping');

  } catch (e) {
    console.error('Fatal:', e.message);
    process.exit(1);
  }
  setTimeout(() => process.exit(0), 500);
})();
