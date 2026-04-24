import { useState, useCallback } from "react";

const defaultTheme = {
  bgMain: "#1a0a2e", bgSidebar: "#0d0221", textPrimary: "#7CFFCB", textSecondary: "#5CE6B8",
  textMuted: "#44CCA0", accentPrimary: "#ff71ce", codeBg: "#0a0118", inlineCodeText: "#ff71ce",
  borderColor: "#6b3fa0", successColor: "#ff71ce", mode: "auto", glassEffect: false, glowEffect: false,
};

const presets = {
  "Onett": { bgMain: "#78B848", bgSidebar: "#5A8838", textPrimary: "#1A1808", textSecondary: "#2A2818", textMuted: "#486830", accentPrimary: "#C83830", codeBg: "#2A3818", inlineCodeText: "#C83830", borderColor: "#5A8838", successColor: "#C83830", mode: "auto", glassEffect: false, glowEffect: false },
  "Twoson": { bgMain: "#E8A848", bgSidebar: "#C08030", textPrimary: "#281808", textSecondary: "#483018", textMuted: "#886838", accentPrimary: "#D05028", codeBg: "#382008", inlineCodeText: "#D05028", borderColor: "#C08030", successColor: "#D05028", mode: "auto", glassEffect: false, glowEffect: false },
  "Threed": { bgMain: "#283848", bgSidebar: "#182028", textPrimary: "#8898A8", textSecondary: "#6878A0", textMuted: "#485868", accentPrimary: "#70A830", codeBg: "#101820", inlineCodeText: "#70A830", borderColor: "#384858", successColor: "#70A830", mode: "dark", glassEffect: true, glowEffect: true },
  "Fourside": { bgMain: "#C8C0B0", bgSidebar: "#A89888", textPrimary: "#2A2418", textSecondary: "#484038", textMuted: "#706858", accentPrimary: "#C88070", codeBg: "#586860", inlineCodeText: "#C88070", borderColor: "#908878", successColor: "#C88070", mode: "auto", glassEffect: false, glowEffect: false },
  "Moonside": { bgMain: "#000000", bgSidebar: "#0a0014", textPrimary: "#E08820", textSecondary: "#FFFF00", textMuted: "#6630AA", accentPrimary: "#FF0088", codeBg: "#3A2088", inlineCodeText: "#FF0088", borderColor: "#E08820", successColor: "#FF0088", mode: "dark", glassEffect: true, glowEffect: true },
  "Summers": { bgMain: "#E0F0F8", bgSidebar: "#B8D8E8", textPrimary: "#183048", textSecondary: "#305068", textMuted: "#7098B0", accentPrimary: "#E87088", codeBg: "#284058", inlineCodeText: "#E87088", borderColor: "#90B8D0", successColor: "#E87088", mode: "light", glassEffect: false, glowEffect: false },
  "Scaraba": { bgMain: "#D8B878", bgSidebar: "#B89048", textPrimary: "#281808", textSecondary: "#483820", textMuted: "#887050", accentPrimary: "#C05028", codeBg: "#382810", inlineCodeText: "#C05028", borderColor: "#A08048", successColor: "#C05028", mode: "auto", glassEffect: false, glowEffect: false },
  "Saturn Valley": { bgMain: "#F8C8D0", bgSidebar: "#E0A0B0", textPrimary: "#382028", textSecondary: "#584048", textMuted: "#988088", accentPrimary: "#E85888", codeBg: "#483040", inlineCodeText: "#58C898", borderColor: "#D098A8", successColor: "#E85888", mode: "auto", glassEffect: false, glowEffect: false },
  "Magicant": { bgMain: "#F0C8E8", bgSidebar: "#D8A0D0", textPrimary: "#301838", textSecondary: "#503058", textMuted: "#907098", accentPrimary: "#E060A0", codeBg: "#382040", inlineCodeText: "#E060A0", borderColor: "#C890C0", successColor: "#E060A0", mode: "auto", glassEffect: false, glowEffect: false },
};

function hexToRgb(hex) { return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }; }

function ColorRow({ label, value, onChange }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, height: 28 }}>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 28, height: 22, border: "1px solid #555", borderRadius: 3, cursor: "pointer", background: "none", padding: 0, flexShrink: 0 }} />
    <span style={{ fontSize: 11, color: "#c0b0e0", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    <input type="text" value={value} onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }} style={{ width: 66, fontFamily: "monospace", fontSize: 10, background: "#0d0221", color: "#7CFFCB", border: "1px solid #6b3fa030", borderRadius: 3, padding: "2px 4px", textAlign: "center" }} />
  </div>);
}
function ToggleRow({ label, value, onChange }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, height: 28 }}>
    <div onClick={() => onChange(!value)} style={{ width: 32, height: 16, borderRadius: 8, background: value ? "#7CFFCB" : "#333", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", position: "absolute", top: 2, left: value ? 18 : 2, transition: "left 0.2s" }} />
    </div>
    <span style={{ fontSize: 11, color: "#c0b0e0" }}>{label}</span>
  </div>);
}
function glassBorders(a) { const {r,g,b}=hexToRgb(a); return { borderTop:`1px solid rgba(${r},${g},${b},0.20)`, borderLeft:`1px solid rgba(${r},${g},${b},0.08)`, borderRight:`1px solid rgba(${r},${g},${b},0.05)`, borderBottom:`1px solid rgba(${r},${g},${b},0.03)`, boxShadow:`0 0 18px rgba(${r},${g},${b},0.08), inset 0 1px 0 rgba(${r},${g},${b},0.12)` }; }
function glassBackground(a, bg) { const {r,g,b}=hexToRgb(a); return `linear-gradient(180deg, rgba(${r},${g},${b},0.10) 0%, rgba(${r},${g},${b},0.04) 100%), ${bg}`; }
function glowStyle(h) { const {r,g,b}=hexToRgb(h); return { textShadow: `0 0 8px rgba(${r},${g},${b},0.6), 0 0 2px rgba(${r},${g},${b},0.9)` }; }

function ClaudeMockup({ t }) {
  const kf = `@keyframes sparkle-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  const cbBase = { borderRadius: 8, padding: "12px 14px", margin: "10px 0", fontFamily: "'Cascadia Code','Fira Code',monospace", fontSize: 12, lineHeight: 1.6, overflowX: "auto", background: t.codeBg, border: `1px solid ${t.borderColor}30` };
  const cb = t.glassEffect ? { ...cbBase, background: glassBackground(t.accentPrimary, t.codeBg), ...glassBorders(t.accentPrimary) } : cbBase;
  const icBase = { background: `${t.codeBg}cc`, color: t.inlineCodeText, padding: "2px 7px", borderRadius: 4, fontSize: 12, border: `1px solid ${t.accentPrimary}25` };
  const ic = t.glowEffect ? { ...icBase, ...glowStyle(t.inlineCodeText) } : icBase;
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.borderColor}50`, display: "flex", flexDirection: "column", height: "100%", background: t.bgMain, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{kf}</style>
      <div style={{ background: t.bgSidebar, padding: "8px 14px", display: "flex", alignItems: "center", borderBottom: `1px solid ${t.borderColor}30`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, marginRight: 14 }}>{["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}</div>
        <span style={{ fontSize: 12, color: t.textMuted, flex: 1, textAlign: "center" }}>Claude Desktop</span><div style={{ width: 50 }} />
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 180, background: t.bgSidebar, borderRight: `1px solid ${t.borderColor}25`, padding: "10px 0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "0 12px", marginBottom: 10 }}>{[["Chat",true],["Code",false],["Cowork",false]].map(([l,a]) => <span key={l} style={{ fontSize: 11, fontWeight: a?700:400, color: a?t.accentPrimary:t.textMuted, marginRight: 12, cursor: "pointer" }}>{l}</span>)}</div>
          <div style={{ padding: "0 12px", marginBottom: 6 }}><div style={{ fontSize: 11, color: t.accentPrimary, cursor: "pointer", padding: "4px 0" }}>+ New chat</div></div>
          <div style={{ fontSize: 9, color: t.textMuted, padding: "6px 12px 2px", textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Recent</div>
          {["Let's Talk!","Honesty is the key to...","Kaggle glove.6B.50d","grep ^honesty dim[6]","have you talked to her?"].map((ti,i) => <div key={i} style={{ fontSize: 11, color: i===0?t.textPrimary:t.textSecondary, padding: "5px 12px", cursor: "pointer", background: i===0?`${t.accentPrimary}15`:"transparent", borderLeft: i===0?`2px solid ${t.accentPrimary}`:"2px solid transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ti}</div>)}
          <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: `1px solid ${t.borderColor}20` }}><div style={{ fontSize: 10, color: t.textMuted }}>SillyHappyDog</div><div style={{ fontSize: 9, color: t.textMuted, opacity: 0.5 }}>Opus 4.6</div></div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ alignSelf: "flex-end", maxWidth: "75%" }}><div style={{ background: `${t.bgSidebar}cc`, color: t.textPrimary, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: 13, lineHeight: 1.5 }}>Can I modify Claude Desktop's theme colors by patching the binary?</div></div>
            <div style={{ maxWidth: "85%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: t.accentPrimary, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div><span style={{ fontSize: 11, color: t.textMuted }}>Claude</span></div>
              <div style={{ color: t.textPrimary, fontSize: 13, lineHeight: 1.65 }}><span style={{ fontSize: 15, fontWeight: 700, display: "block", marginBottom: 6 }}>3-Layer Security Analysis</span>Electron apps have a <strong>3-layer security</strong> architecture. See <a href="#" style={{ color: t.accentPrimary, textDecoration: "none" }} onClick={e => e.preventDefault()}>IMPLEMENTATION_LOG</a> for details.</div>
              <div style={cb}><div><span style={{ color: t.accentPrimary }}>const</span> <span style={{ color: "#ddd" }}>{"{"}</span> <span style={{ color: t.textPrimary }}>flipFuses</span><span style={{ color: "#ddd" }}>{","}</span> <span style={{ color: t.textPrimary }}>FuseV1Options</span> <span style={{ color: "#ddd" }}>{"}"}</span> <span style={{ color: t.accentPrimary }}>=</span> <span style={{ color: t.accentPrimary }}>require</span><span style={{ color: "#ddd" }}>(</span><span style={{ color: t.accentPrimary }}>'@electron/fuses'</span><span style={{ color: "#ddd" }}>)</span><span style={{ color: "#ddd" }}>;</span></div><div style={{ marginTop: 4 }}><span style={{ color: t.accentPrimary }}>await</span> <span style={{ color: t.textPrimary }}>flipFuses</span><span style={{ color: "#ddd" }}>(</span><span style={{ color: t.accentPrimary }}>'claude.exe'</span><span style={{ color: "#ddd" }}>,</span> <span style={{ color: "#ddd" }}>{"{"}</span></div><div style={{ paddingLeft: 16 }}><span style={{ color: t.accentPrimary }}>[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]</span><span style={{ color: "#ddd" }}>:</span> <span style={{ color: t.accentPrimary }}>false</span></div><div><span style={{ color: "#ddd" }}>{"}"}</span><span style={{ color: "#ddd" }}>)</span><span style={{ color: "#ddd" }}>;</span></div></div>
              <div style={{ color: t.textPrimary, fontSize: 13, lineHeight: 1.65, marginTop: 8 }}><code style={ic}>flipFuses()</code> then replace{" "}<code style={ic}>app.asar</code> — that's it.</div>
              <table style={{ borderCollapse: "collapse", margin: "10px 0", fontSize: 11, width: "100%" }}><thead><tr>{["Layer","Mechanism","Bypass"].map(h => <th key={h} style={{ background: t.codeBg, color: t.accentPrimary, padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${t.borderColor}40`, fontWeight: 600 }}>{h}</th>)}</tr></thead><tbody>{[["MSIX","BlockMap SHA256","Switch to Squirrel"],["Asar Integrity","Embedded hash","Flip fuse"],["Fuse: Inspect","CDP blocked","Flip fuse"]].map(([a,b,c],i) => <tr key={i}>{[a,b,c].map((v,j) => <td key={j} style={{ color: t.textPrimary, padding: "5px 10px", borderBottom: `1px solid ${t.borderColor}20` }}>{v}</td>)}</tr>)}</tbody></table>
              <blockquote style={{ borderLeft: `3px solid ${t.accentPrimary}`, background: `${t.codeBg}50`, padding: "8px 14px", margin: "8px 0", borderRadius: "0 6px 6px 0" }}><span style={{ color: t.accentPrimary, fontSize: 12, fontStyle: "italic" }}>Share the knowledge, not the binary.</span></blockquote>
              <div style={{ color: t.textSecondary, fontSize: 12, marginTop: 6 }}>Shortest path: <strong style={{ color: t.textPrimary }}>Flip 2 fuses → replace asar</strong>. That's all.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${t.accentPrimary}`, borderTopColor: "transparent", animation: "sparkle-spin 0.8s linear infinite" }} /><span style={{ fontSize: 11, color: t.textMuted }}>Thinking...</span></div>
          </div>
          <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${t.borderColor}20`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", background: `${t.bgSidebar}cc`, borderRadius: 12, border: `1px solid ${t.borderColor}30`, padding: "10px 14px" }}>
              <span style={{ flex: 1, fontSize: 13, color: t.textMuted, opacity: 0.6 }}>Reply...</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: t.accentPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 0 10px ${t.accentPrimary}40`, flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></div>
            </div>
            <div style={{ textAlign: "center", fontSize: 9, color: t.textMuted, marginTop: 6, opacity: 0.5 }}>Opus 4.6 Extended Thinking</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeStudio() {
  const [theme, setTheme] = useState(presets["Onett"]);
  const [activePreset, setActivePreset] = useState("Onett");
  const [copyState, setCopyState] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const update = useCallback((key, val) => { setTheme(prev => ({ ...prev, [key]: val })); setActivePreset(""); }, []);
  const loadPreset = (name) => { setTheme(presets[name]); setActivePreset(name); };
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText); const merged = { ...defaultTheme };
      for (const key of Object.keys(merged)) {
        if (key === "glassEffect" || key === "glowEffect") { if (typeof parsed[key] === "boolean") merged[key] = parsed[key]; }
        else if (key === "mode") { if (["light","dark","auto"].includes(parsed[key])) merged[key] = parsed[key]; }
        else if (parsed[key] && /^#[0-9a-fA-F]{6,8}$/.test(parsed[key])) merged[key] = parsed[key];
      }
      if (parsed.name) merged.name = parsed.name;
      setTheme(merged); setActivePreset(""); setImportOpen(false); setImportText(""); setImportError("");
      setCopyState("imported"); setTimeout(() => setCopyState(""), 2000);
    } catch { setImportError("Invalid JSON"); }
  };
  const buildExportJSON = () => {
    const { mode, glassEffect, glowEffect, ...colors } = theme; const obj = { ...colors };
    if (mode && mode !== "auto") obj.mode = mode;
    if (glassEffect) obj.glassEffect = true; if (glowEffect) obj.glowEffect = true;
    return JSON.stringify(obj, null, 2);
  };
  const doCopy = (text, label) => {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); setCopyState(label); setTimeout(() => setCopyState(""), 2000); } catch {}
    document.body.removeChild(ta);
  };
  const groups = [
    { title: "Background", items: [["bgMain","Main bg"],["bgSidebar","Sidebar bg"]] },
    { title: "Text", items: [["textPrimary","Primary"],["textSecondary","Secondary"],["textMuted","Muted"]] },
    { title: "Accents", items: [["accentPrimary","Buttons / Brand"],["successColor","Success"]] },
    { title: "Code", items: [["codeBg","Code bg"],["inlineCodeText","Inline code"]] },
    { title: "UI", items: [["borderColor","Borders"]] },
  ];
  return (
    <div style={{ background: "#08010f", color: "#e0d0ff", height: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #6b3fa025", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, background: "linear-gradient(90deg, #ff71ce, #b967ff, #01cdfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Claude Desktop Theme Studio</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>{Object.keys(presets).map(name => (
          <button key={name} onClick={() => loadPreset(name)} style={{ padding: "3px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer", border: "1px solid", borderColor: activePreset === name ? "#ff71ce" : "#6b3fa030", background: activePreset === name ? "#ff71ce18" : "transparent", color: activePreset === name ? "#ff71ce" : "#8070a0", transition: "all 0.15s" }}>{name}</button>
        ))}</div>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 260, borderRight: "1px solid #6b3fa025", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
            {groups.map(g => (<div key={g.title}><div style={{ fontSize: 9, fontWeight: 700, color: "#5040a0", textTransform: "uppercase", letterSpacing: 1.2, margin: "8px 0 3px" }}>{g.title}</div>{g.items.map(([k,l]) => <ColorRow key={k} label={l} value={theme[k]} onChange={v => update(k, v)} />)}</div>))}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#5040a0", textTransform: "uppercase", letterSpacing: 1.2, margin: "8px 0 3px" }}>Effects</div>
            <ToggleRow label="Glass (code blocks)" value={theme.glassEffect} onChange={v => update("glassEffect", v)} />
            <ToggleRow label="Glow (inline code)" value={theme.glowEffect} onChange={v => update("glowEffect", v)} />
          </div>
          <div style={{ padding: "8px 10px", borderTop: "1px solid #6b3fa020", display: "flex", flexDirection: "column", gap: 4 }}>
            {importOpen && (<div style={{ marginBottom: 4 }}><textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError(""); }} placeholder='{"bgMain":"#1a0a2e", ...}' style={{ width: "100%", height: 60, background: "#0a0118", borderRadius: 4, padding: 6, fontSize: 9, color: "#7CFFCB", border: `1px solid ${importError ? "#ff5555" : "#6b3fa030"}`, fontFamily: "monospace", resize: "none", boxSizing: "border-box" }} />{importError && <div style={{ fontSize: 9, color: "#ff5555", marginTop: 2 }}>{importError}</div>}<div style={{ display: "flex", gap: 4, marginTop: 4 }}><button onClick={handleImport} style={{ flex: 1, padding: "5px 0", fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: "pointer", border: "none", background: "#7CFFCB", color: "#0d0221" }}>Apply</button><button onClick={() => { setImportOpen(false); setImportText(""); setImportError(""); }} style={{ padding: "5px 10px", fontSize: 10, borderRadius: 4, cursor: "pointer", border: "1px solid #6b3fa040", background: "transparent", color: "#8070a0" }}>Cancel</button></div></div>)}
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => doCopy(buildExportJSON(), "export")} style={{ flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer", border: "none", background: copyState === "export" ? "#7CFFCB" : "linear-gradient(135deg, #ff71ce, #b967ff)", color: copyState === "export" ? "#0d0221" : "#fff", boxShadow: copyState === "export" ? "0 0 20px #7CFFCB50" : "0 0 12px #ff71ce30" }}>{copyState === "export" ? "Copied!" : "Export JSON"}</button>
              <button onClick={() => { setImportOpen(!importOpen); setImportError(""); }} style={{ padding: "8px 8px", fontSize: 10, borderRadius: 6, cursor: "pointer", border: "1px solid #6b3fa050", background: importOpen ? "#ff71ce15" : (copyState === "imported" ? "#7CFFCB15" : "transparent"), color: importOpen ? "#ff71ce" : (copyState === "imported" ? "#7CFFCB" : "#8070a0") }}>{copyState === "imported" ? "Done!" : "Import"}</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: 12, display: "flex", minWidth: 0 }}><ClaudeMockup t={theme} /></div>
      </div>
    </div>
  );
}
