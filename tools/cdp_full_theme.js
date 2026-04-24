// Full theme injection via CDP — does everything __themeApply would do
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const THEME_FILE = path.join(require('os').homedir(), '.claude', 'theme.json');
const theme = JSON.parse(fs.readFileSync(THEME_FILE, 'utf-8').replace(/^\uFEFF/, ''));

// Get target ID from command line or auto-detect
async function getTargetId() {
  const resp = await fetch('http://localhost:9222/json');
  const targets = await resp.json();
  const claude = targets.find(t => t.url.includes('claude.ai'));
  if (!claude) throw new Error('No claude.ai target found');
  return claude.id;
}

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

const cs = hexToHSL(theme.bgMain || '#000000').l < 50 ? 'dark' : 'light';

// Build the injection script
let script = '(function(){var s=document.documentElement.style;';
for (const [v, val] of pairs) {
  script += `s.setProperty(${JSON.stringify(v)},${JSON.stringify(val)},'important');`;
}
script += `s.setProperty('color-scheme',${JSON.stringify(cs)},'important');`;
if (theme.bgMain) script += `if(document.body)document.body.style.setProperty('background',${JSON.stringify(theme.bgMain)},'important');`;

// Style tag
const bgSidebarHSL = theme.bgSidebar ? hexToHSL(theme.bgSidebar) : null;
const bgMainHSL = theme.bgMain ? hexToHSL(theme.bgMain) : null;
let css = '';
if (bgSidebarHSL) {
  const h1 = `${bgSidebarHSL.h} ${bgSidebarHSL.s}% ${bgSidebarHSL.l}%`;
  css += `.bg-bg-100{background-color:hsl(${h1})!important}`;
}
if (bgMainHSL) {
  const h0 = `${bgMainHSL.h} ${bgMainHSL.s}% ${bgMainHSL.l}%`;
  css += `.bg-bg-000{background-color:hsl(${h0})!important}`;
}
css += '.standard-markdown code:not(pre code){border:none!important;background:transparent!important}';
css += 'pre.code-block__code,pre.code-block__code>code{background:transparent!important;background-color:transparent!important}';
if (theme.codeBg) {
  css += `.bg-bg-000\\/50{background-color:${theme.codeBg}!important;background:${theme.codeBg}!important}`;
}

script += `var _sid='__theme-override-styles';var _sel=document.getElementById(_sid);`;
script += `if(!_sel){_sel=document.createElement('style');_sel.id=_sid;document.head.appendChild(_sel);}`;
script += `_sel.textContent=${JSON.stringify(css)};`;

// __themeFixEls equivalent + interval + observer
script += `function __themeFixEls(){`;
script += `document.querySelectorAll('code').forEach(function(c){if(!c.closest('pre')){c.style.setProperty('border','none','important');c.style.setProperty('background','transparent','important');}});`;
script += `var dc=document.querySelector('.dframe-content');if(dc)dc.style.setProperty('background-color',${JSON.stringify(theme.bgMain||'#0A0A0A')},'important');`;
script += `var ds=document.querySelector('.dframe-sidebar');if(ds)ds.style.setProperty('background-color',${JSON.stringify(theme.bgSidebar||'#050505')},'important');`;
if (theme.codeBg) {
  script += `document.querySelectorAll('pre.code-block__code').forEach(function(p){p.style.setProperty('background','transparent','important');var c=p.querySelector('code');if(c)c.style.setProperty('background','transparent','important');});`;
}
script += `}__themeFixEls();`;
script += `if(window.__themeInterval)clearInterval(window.__themeInterval);window.__themeInterval=setInterval(__themeFixEls,2000);`;
script += `if(window.__themeObs)window.__themeObs.disconnect();window.__themeObs=new MutationObserver(__themeFixEls);window.__themeObs.observe(document.documentElement,{childList:true,subtree:true});`;

// Desktop frame elements — dframe-content is the main culprit for gray background
script += `var dc=document.querySelector('.dframe-content');if(dc)dc.style.setProperty('background-color',${JSON.stringify(theme.bgMain||'#0A0A0A')},'important');`;
script += `var ds=document.querySelector('.dframe-sidebar');if(ds)ds.style.setProperty('background-color',${JSON.stringify(theme.bgSidebar||theme.bgMain||'#050505')},'important');`;

// Glass effect
script += `document.querySelectorAll('[class*="group/copy"]').forEach(function(el){`;
script += `el.style.setProperty('background','linear-gradient(180deg, rgba(0,255,40,0.08) 0%, rgba(0,255,40,0.04) 100%)','important');`;
script += `el.style.setProperty('backdrop-filter','brightness(1.15)','important');`;
script += `el.style.setProperty('-webkit-backdrop-filter','brightness(1.15)','important');`;
script += `el.style.setProperty('border-top','1px solid rgba(0,255,65,0.15)','important');`;
script += `el.style.setProperty('border-left','1px solid rgba(0,255,65,0.06)','important');`;
script += `el.style.setProperty('border-right','1px solid rgba(0,255,65,0.04)','important');`;
script += `el.style.setProperty('border-bottom','1px solid rgba(0,255,65,0.03)','important');`;
script += `el.style.setProperty('box-shadow','0 0 15px rgba(0,255,40,0.06), inset 0 1px 0 rgba(0,255,65,0.1)','important');`;
script += `});`;

// Gold inline code glow
script += `document.querySelectorAll('code:not(pre code)').forEach(function(c){`;
script += `c.style.setProperty('color','#FFB830','important');`;
script += `c.style.setProperty('text-shadow','0 0 8px rgba(255,184,48,0.5), 0 0 2px rgba(255,184,48,0.8)','important');`;
script += `});`;

script += `return 'Full theme + glass + gold applied';})()`;

(async () => {
  const targetId = await getTargetId();
  console.log('Target:', targetId);
  const ws = new WebSocket(`ws://localhost:9222/devtools/page/${targetId}`);
  ws.on('open', () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script } }));
  });
  ws.on('message', (data) => {
    const r = JSON.parse(data.toString());
    if (r.id === 1) {
      console.log(r.result?.result?.value || JSON.stringify(r, null, 2));
      ws.close();
    }
  });
  ws.on('error', (e) => { console.error('WS error:', e.message); process.exit(1); });
  setTimeout(() => { console.error('Timeout'); process.exit(1); }, 10000);
})();
