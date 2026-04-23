import { useState, useCallback } from "react";

const defaultTheme = {
  bgMain: "#1a0a2e", bgSidebar: "#0d0221", textPrimary: "#7CFFCB", textSecondary: "#5CE6B8",
  textMuted: "#44CCA0", accentPink: "#ff71ce", accentCyan: "#01cdfe", accentPurple: "#b967ff",
  codeBg: "#0a0118", codeText: "#7CFFCB", inlineCodeText: "#ff71ce", headingColor: "#ff71ce",
  boldColor: "#a0ffe0", linkColor: "#01cdfe", borderColor: "#6b3fa0", selectionBg: "#ff71ce66",
  userBubbleBg: "#2a1548", userBubbleText: "#e0d0ff",
};

const presets = {
  "Onett": {
    bgMain: "#78B848", bgSidebar: "#5A8838", textPrimary: "#1A1808", textSecondary: "#2A2818",
    textMuted: "#486830", accentPink: "#C83830", accentCyan: "#3890D8", accentPurple: "#685828",
    codeBg: "#2A3818", codeText: "#A8D878", inlineCodeText: "#C83830", headingColor: "#2A2818",
    boldColor: "#1A1808", linkColor: "#3890D8", borderColor: "#5A8838", selectionBg: "#3890D855",
    userBubbleBg: "#A8D070", userBubbleText: "#1A1808",
  },
  "Twoson": {
    bgMain: "#E8A848", bgSidebar: "#C08030", textPrimary: "#281808", textSecondary: "#483018",
    textMuted: "#886838", accentPink: "#D05028", accentCyan: "#48A078", accentPurple: "#985830",
    codeBg: "#382008", codeText: "#F0C868", inlineCodeText: "#D05028", headingColor: "#382008",
    boldColor: "#281808", linkColor: "#48A078", borderColor: "#C08030", selectionBg: "#48A07855",
    userBubbleBg: "#D09038", userBubbleText: "#281808",
  },
  "Threed": {
    bgMain: "#283848", bgSidebar: "#182028", textPrimary: "#8898A8", textSecondary: "#6878A0",
    textMuted: "#485868", accentPink: "#70A830", accentCyan: "#4868A8", accentPurple: "#584878",
    codeBg: "#101820", codeText: "#6888B0", inlineCodeText: "#70A830", headingColor: "#8898A8",
    boldColor: "#A0B0C0", linkColor: "#4868A8", borderColor: "#384858", selectionBg: "#70A83055",
    userBubbleBg: "#1C2830", userBubbleText: "#8898A8",
  },
  "Fourside": {
    bgMain: "#C8C0B0", bgSidebar: "#A89888", textPrimary: "#2A2418", textSecondary: "#484038",
    textMuted: "#706858", accentPink: "#C88070", accentCyan: "#508868", accentPurple: "#887080",
    codeBg: "#586860", codeText: "#98B8A8", inlineCodeText: "#C88070", headingColor: "#484038",
    boldColor: "#2A2418", linkColor: "#508868", borderColor: "#908878", selectionBg: "#98B8A855",
    userBubbleBg: "#B8B0A0", userBubbleText: "#2A2418",
  },
  "Moonside": {
    bgMain: "#000000", bgSidebar: "#0a0014", textPrimary: "#E08820", textSecondary: "#FFFF00",
    textMuted: "#6630AA", accentPink: "#FF0088", accentCyan: "#00E830", accentPurple: "#6630AA",
    codeBg: "#3A2088", codeText: "#FFFF00", inlineCodeText: "#FF0088", headingColor: "#FF0088",
    boldColor: "#FFFF00", linkColor: "#00E830", borderColor: "#E08820", selectionBg: "#FF008855",
    userBubbleBg: "#3A2088", userBubbleText: "#E08820",
  },
  "Summers": {
    bgMain: "#E0F0F8", bgSidebar: "#B8D8E8", textPrimary: "#183048", textSecondary: "#305068",
    textMuted: "#7098B0", accentPink: "#E87088", accentCyan: "#38A8C8", accentPurple: "#8870A8",
    codeBg: "#284058", codeText: "#90D0E8", inlineCodeText: "#E87088", headingColor: "#183048",
    boldColor: "#183048", linkColor: "#38A8C8", borderColor: "#90B8D0", selectionBg: "#38A8C844",
    userBubbleBg: "#C8E0F0", userBubbleText: "#183048",
  },
  "Scaraba": {
    bgMain: "#D8B878", bgSidebar: "#B89048", textPrimary: "#281808", textSecondary: "#483820",
    textMuted: "#887050", accentPink: "#C05028", accentCyan: "#2868A8", accentPurple: "#884830",
    codeBg: "#382810", codeText: "#D8C088", inlineCodeText: "#C05028", headingColor: "#382810",
    boldColor: "#281808", linkColor: "#2868A8", borderColor: "#A08048", selectionBg: "#2868A844",
    userBubbleBg: "#C8A060", userBubbleText: "#281808",
  },
  "Saturn Valley": {
    bgMain: "#F8C8D0", bgSidebar: "#E0A0B0", textPrimary: "#382028", textSecondary: "#584048",
    textMuted: "#988088", accentPink: "#E85888", accentCyan: "#58C898", accentPurple: "#A870B8",
    codeBg: "#483040", codeText: "#F0B0C0", inlineCodeText: "#58C898", headingColor: "#382028",
    boldColor: "#382028", linkColor: "#58C898", borderColor: "#D098A8", selectionBg: "#58C89855",
    userBubbleBg: "#E8B0C0", userBubbleText: "#382028",
  },
  "Magicant": {
    bgMain: "#F0C8E8", bgSidebar: "#D8A0D0", textPrimary: "#301838", textSecondary: "#503058",
    textMuted: "#907098", accentPink: "#E060A0", accentCyan: "#80C0E8", accentPurple: "#B868D0",
    codeBg: "#382040", codeText: "#D8A8E8", inlineCodeText: "#E060A0", headingColor: "#382040",
    boldColor: "#301838", linkColor: "#80C0E8", borderColor: "#C890C0", selectionBg: "#80C0E844",
    userBubbleBg: "#E0B0D8", userBubbleText: "#301838",
  },
};

function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, height: 28 }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 28, height: 22, border: "1px solid #555", borderRadius: 3, cursor: "pointer", background: "none", padding: 0, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#c0b0e0", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <input type="text" value={value} onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }}
        style={{ width: 66, fontFamily: "monospace", fontSize: 10, background: "#0d0221", color: "#7CFFCB", border: "1px solid #6b3fa030", borderRadius: 3, padding: "2px 4px", textAlign: "center" }} />
    </div>
  );
}

/* ─── Realistic Claude Desktop Mockup ─── */
function ClaudeMockup({ t }) {
  const sparkleKeyframes = `@keyframes sparkle-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.borderColor}50`, display: "flex", flexDirection: "column", height: "100%", background: t.bgMain, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{sparkleKeyframes}</style>

      {/* ── Title bar ── */}
      <div style={{ background: t.bgSidebar, padding: "8px 14px", display: "flex", alignItems: "center", borderBottom: `1px solid ${t.borderColor}30`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, marginRight: 14 }}>
          {["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
        </div>
        <span style={{ fontSize: 12, color: t.textMuted, flex: 1, textAlign: "center" }}>Claude Desktop</span>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <div style={{ width: 180, background: t.bgSidebar, borderRight: `1px solid ${t.borderColor}25`, padding: "10px 0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "0 12px", marginBottom: 10 }}>
            {[["Chat", true], ["Code", false], ["Cowork", false]].map(([label, active]) => (
              <span key={label} style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? t.accentPink : t.textMuted, marginRight: 12, cursor: "pointer" }}>{label}</span>
            ))}
          </div>
          <div style={{ padding: "0 12px", marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: t.accentCyan, cursor: "pointer", padding: "4px 0" }}>+ New chat</div>
          </div>
          <div style={{ fontSize: 9, color: t.textMuted, padding: "6px 12px 2px", textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Recent</div>
          {["Let's Talk!", "Honesty is the key to...", "Kaggle glove.6B.50d", "grep ^honesty dim[6]", "have you talked to her?"].map((title, i) => (
            <div key={i} style={{
              fontSize: 11, color: i === 0 ? t.textPrimary : t.textSecondary, padding: "5px 12px", cursor: "pointer",
              background: i === 0 ? `${t.accentPink}15` : "transparent", borderLeft: i === 0 ? `2px solid ${t.accentPink}` : "2px solid transparent",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{title}</div>
          ))}
          <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: `1px solid ${t.borderColor}20` }}>
            <div style={{ fontSize: 10, color: t.textMuted }}>SillyHappyDog</div>
            <div style={{ fontSize: 9, color: t.textMuted, opacity: 0.5 }}>Opus 4.6</div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* User message */}
            <div style={{ alignSelf: "flex-end", maxWidth: "75%" }}>
              <div style={{ background: t.userBubbleBg, color: t.userBubbleText, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: 13, lineHeight: 1.5 }}>
                Can I modify Claude Desktop's theme colors by patching the binary?
              </div>
            </div>

            {/* Claude response */}
            <div style={{ maxWidth: "85%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg, ${t.accentPink}, ${t.accentPurple})`, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
                <span style={{ fontSize: 11, color: t.textMuted }}>Claude</span>
              </div>
              <div style={{ color: t.textPrimary, fontSize: 13, lineHeight: 1.65 }}>
                <span style={{ color: t.headingColor, fontSize: 15, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  3-Layer Security Analysis
                </span>
                Electron apps have a <strong style={{ color: t.boldColor }}>3-layer security</strong> architecture.
                See <a href="#" style={{ color: t.linkColor, textDecoration: "none" }} onClick={e => e.preventDefault()}>IMPLEMENTATION_LOG</a> for details.
              </div>

              {/* Code block */}
              <div style={{ background: t.codeBg, borderRadius: 8, padding: "12px 14px", margin: "10px 0", border: `1px solid ${t.borderColor}30`, fontFamily: "'Cascadia Code', 'Fira Code', monospace", fontSize: 12, lineHeight: 1.6, overflowX: "auto" }}>
                <div><span style={{ color: t.accentPink }}>const</span> <span style={{ color: "#ddd" }}>{"{"}</span> <span style={{ color: t.codeText }}>flipFuses</span><span style={{ color: "#ddd" }}>{","}</span> <span style={{ color: t.codeText }}>FuseV1Options</span> <span style={{ color: "#ddd" }}>{"}"}</span> <span style={{ color: t.accentPink }}>=</span> <span style={{ color: t.accentCyan }}>require</span><span style={{ color: "#ddd" }}>(</span><span style={{ color: t.accentCyan }}>'@electron/fuses'</span><span style={{ color: "#ddd" }}>)</span><span style={{ color: "#ddd" }}>;</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: t.accentPink }}>await</span> <span style={{ color: t.codeText }}>flipFuses</span><span style={{ color: "#ddd" }}>(</span><span style={{ color: t.accentCyan }}>'claude.exe'</span><span style={{ color: "#ddd" }}>,</span> <span style={{ color: "#ddd" }}>{"{"}</span></div>
                <div style={{ paddingLeft: 16 }}><span style={{ color: t.accentPurple }}>[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]</span><span style={{ color: "#ddd" }}>:</span> <span style={{ color: t.accentPink }}>false</span></div>
                <div><span style={{ color: "#ddd" }}>{"}"}</span><span style={{ color: "#ddd" }}>)</span><span style={{ color: "#ddd" }}>;</span></div>
              </div>

              {/* Inline code + table */}
              <div style={{ color: t.textPrimary, fontSize: 13, lineHeight: 1.65, marginTop: 8 }}>
                <code style={{ background: `${t.codeBg}cc`, color: t.inlineCodeText, padding: "2px 7px", borderRadius: 4, fontSize: 12, border: `1px solid ${t.accentPink}25` }}>flipFuses()</code> then replace
                <code style={{ background: `${t.codeBg}cc`, color: t.inlineCodeText, padding: "2px 7px", borderRadius: 4, fontSize: 12, border: `1px solid ${t.accentPink}25` }}>app.asar</code> — that's it.
              </div>

              {/* Mini table */}
              <table style={{ borderCollapse: "collapse", margin: "10px 0", fontSize: 11, width: "100%" }}>
                <thead>
                  <tr>
                    {["Layer", "Mechanism", "Bypass"].map(h => (
                      <th key={h} style={{ background: t.codeBg, color: t.accentPink, padding: "6px 10px", textAlign: "left", borderBottom: `1px solid ${t.borderColor}40`, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MSIX", "BlockMap SHA256", "Switch to Squirrel"],
                    ["Asar Integrity", "Embedded hash", "Flip fuse"],
                    ["Fuse: Inspect", "CDP blocked", "Flip fuse"],
                  ].map(([a,b,c], i) => (
                    <tr key={i}>
                      {[a,b,c].map((v,j) => (
                        <td key={j} style={{ color: t.textPrimary, padding: "5px 10px", borderBottom: `1px solid ${t.borderColor}20` }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Blockquote */}
              <blockquote style={{ borderLeft: `3px solid ${t.accentPink}`, background: `${t.codeBg}50`, padding: "8px 14px", margin: "8px 0", borderRadius: "0 6px 6px 0" }}>
                <span style={{ color: t.accentPurple, fontSize: 12, fontStyle: "italic" }}>Share the knowledge, not the binary.</span>
              </blockquote>

              <div style={{ color: t.textSecondary, fontSize: 12, marginTop: 6 }}>
                Shortest path: <strong style={{ color: t.boldColor }}>Flip 2 fuses → replace asar</strong>. That's all.
              </div>
            </div>

            {/* Loading indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${t.accentPink}`, borderTopColor: "transparent", animation: "sparkle-spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 11, color: t.textMuted }}>Thinking...</span>
            </div>
          </div>

          {/* ── Input area ── */}
          <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${t.borderColor}20`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", background: `${t.bgSidebar}cc`, borderRadius: 12, border: `1px solid ${t.borderColor}30`, padding: "10px 14px" }}>
              <span style={{ flex: 1, fontSize: 13, color: t.textMuted, opacity: 0.6 }}>Reply...</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${t.accentPink}, ${t.accentPurple})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 0 10px ${t.accentPink}40`, flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 9, color: t.textMuted, marginTop: 6, opacity: 0.5 }}>Opus 4.6 Extended Thinking</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function ThemeStudio() {
  const [theme, setTheme] = useState(presets["Onett"]);
  const [activePreset, setActivePreset] = useState("Onett");
  const [copyState, setCopyState] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const update = useCallback((key, val) => {
    setTheme(prev => ({ ...prev, [key]: val }));
    setActivePreset("");
  }, []);

  const loadPreset = (name) => { setTheme(presets[name]); setActivePreset(name); };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const merged = { ...defaultTheme };
      for (const key of Object.keys(merged)) {
        if (parsed[key] && /^#[0-9a-fA-F]{6,8}$/.test(parsed[key])) {
          merged[key] = parsed[key];
        }
      }
      setTheme(merged);
      setActivePreset("");
      setImportOpen(false);
      setImportText("");
      setImportError("");
      setCopyState("imported");
      setTimeout(() => setCopyState(""), 2000);
    } catch {
      setImportError("Invalid JSON");
    }
  };

  const doCopy = (text, label) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); setCopyState(label); setTimeout(() => setCopyState(""), 2000); }
    catch { /* copy failed */ }
    document.body.removeChild(ta);
  };

  const groups = [
    { title: "Background", items: [["bgMain","Main bg"],["bgSidebar","Sidebar bg"]] },
    { title: "Text", items: [["textPrimary","Primary"],["textSecondary","Secondary"],["textMuted","Muted"]] },
    { title: "Accents", items: [["accentPink","Buttons / Caret"],["accentCyan","Glow / Strings"],["accentPurple","Scrollbar / Sub"]] },
    { title: "Typography", items: [["headingColor","Headings"],["boldColor","Bold"],["linkColor","Links"]] },
    { title: "Code", items: [["codeBg","Code bg"],["codeText","Code text"],["inlineCodeText","Inline code"]] },
    { title: "UI", items: [["borderColor","Borders"],["selectionBg","Selection"],["userBubbleBg","User bubble"],["userBubbleText","User text"]] },
  ];

  return (
    <div style={{ background: "#08010f", color: "#e0d0ff", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #6b3fa025", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, background: "linear-gradient(90deg, #ff71ce, #b967ff, #01cdfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Claude Desktop Theme Studio
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {Object.keys(presets).map(name => (
            <button key={name} onClick={() => loadPreset(name)}
              style={{ padding: "3px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer", border: "1px solid",
                borderColor: activePreset === name ? "#ff71ce" : "#6b3fa030",
                background: activePreset === name ? "#ff71ce18" : "transparent",
                color: activePreset === name ? "#ff71ce" : "#8070a0", transition: "all 0.15s" }}>
              {name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left: Controls */}
        <div style={{ width: 260, borderRight: "1px solid #6b3fa025", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
            {groups.map(g => (
              <div key={g.title}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#5040a0", textTransform: "uppercase", letterSpacing: 1.2, margin: "8px 0 3px" }}>{g.title}</div>
                {g.items.map(([k,l]) => <ColorRow key={k} label={l} value={theme[k]} onChange={v => update(k, v)} />)}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid #6b3fa020", display: "flex", flexDirection: "column", gap: 4 }}>
            {importOpen && (
              <div style={{ marginBottom: 4 }}>
                <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError(""); }}
                  placeholder='{"bgMain":"#1a0a2e", ...}'
                  style={{ width: "100%", height: 60, background: "#0a0118", borderRadius: 4, padding: 6, fontSize: 9,
                    color: "#7CFFCB", border: `1px solid ${importError ? "#ff5555" : "#6b3fa030"}`, fontFamily: "monospace",
                    resize: "none", boxSizing: "border-box" }} />
                {importError && <div style={{ fontSize: 9, color: "#ff5555", marginTop: 2 }}>{importError}</div>}
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <button onClick={handleImport}
                    style={{ flex: 1, padding: "5px 0", fontSize: 10, fontWeight: 600, borderRadius: 4, cursor: "pointer", border: "none",
                      background: "#7CFFCB", color: "#0d0221" }}>Apply</button>
                  <button onClick={() => { setImportOpen(false); setImportText(""); setImportError(""); }}
                    style={{ padding: "5px 10px", fontSize: 10, borderRadius: 4, cursor: "pointer",
                      border: "1px solid #6b3fa040", background: "transparent", color: "#8070a0" }}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => doCopy(JSON.stringify(theme, null, 2), "export")}
                style={{ flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                  border: "none",
                  background: copyState === "export" ? "#7CFFCB" : "linear-gradient(135deg, #ff71ce, #b967ff)",
                  color: copyState === "export" ? "#0d0221" : "#fff",
                  boxShadow: copyState === "export" ? "0 0 20px #7CFFCB50" : "0 0 12px #ff71ce30" }}>
                {copyState === "export" ? "Copied!" : "Export JSON"}
              </button>
              <button onClick={() => { setImportOpen(!importOpen); setImportError(""); }}
                style={{ padding: "8px 8px", fontSize: 10, borderRadius: 6, cursor: "pointer",
                  border: "1px solid #6b3fa050",
                  background: importOpen ? "#ff71ce15" : (copyState === "imported" ? "#7CFFCB15" : "transparent"),
                  color: importOpen ? "#ff71ce" : (copyState === "imported" ? "#7CFFCB" : "#8070a0") }}>
                {copyState === "imported" ? "Done!" : "Import"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Mockup */}
        <div style={{ flex: 1, padding: 12, display: "flex", minWidth: 0 }}>
          <ClaudeMockup t={theme} />
        </div>
      </div>
    </div>
  );
}
