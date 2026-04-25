# Themes

Drop any `.json` file from this directory into `~/.claude/theme.json` to apply it.

## Matrix (Author's Benchmark)

![Matrix Theme](../screenshots/matrix.png)

The theme used by the project author. Designed to look like a CRT terminal — green phosphor text on black, with translucent green code blocks.

```bash
cp themes/matrix.json ~/.claude/theme.json
```

### Design notes

- **Near-black background** (`#0A0A0A`) with a slightly darker sidebar (`#050505`). Pure black (`#000000`) feels flat on LCD screens; `#0A0A0A` has just enough depth.
- **Inline code** uses `#FF6B6B` (red) to contrast against the green text — makes file names and variable references pop without breaking the color narrative.
- **Code block background** uses `rgba(0,255,10,0.05)` — a 5% translucent green. This creates a subtle glass-panel effect where code blocks feel like they float above the background rather than being painted on it.
- **Border color** (`#0A3A0A`) is dark green, barely visible. Borders exist to structure, not to decorate.

### Going further: glass effect

The screenshot above includes a translucent glass effect on code blocks that goes beyond what `theme.json` can express. This uses CSS `backdrop-filter` and `linear-gradient`, applied by `cdp_full_theme.js` when `glassEffect` is enabled in the theme.

```css
/* Applied to code block wrappers (.group/copy elements) */
background: linear-gradient(180deg, rgba(0,255,40,0.08) 0%, rgba(0,255,40,0.04) 100%);
backdrop-filter: brightness(1.15);
border-top: 1px solid rgba(0,255,65,0.15);
box-shadow: 0 0 15px rgba(0,255,40,0.06), inset 0 1px 0 rgba(0,255,65,0.1);
```

## Summers (Light Theme Example)

A warm, paper-like light theme. Demonstrates **Theme Mode Independence** — this theme forces light mode regardless of Claude Desktop's Appearance setting.

```bash
cp themes/summers.json ~/.claude/theme.json
```

Glass and glow effects are disabled by default for light themes (they're designed for dark backgrounds).

## Theme JSON Schema

Create a JSON file with any subset of the supported keys:

| Key | Type | What it controls |
|---|---|---|
| name | string | Theme display name (optional) |
| mode | `"light"` \| `"dark"` \| `"auto"` | Force light/dark mode. Default: auto-detect from `bgMain` luminance |
| bgMain | hex | Main background |
| bgSidebar | hex | Sidebar background |
| textPrimary | hex | Primary text |
| textSecondary | hex | Secondary text |
| textMuted | hex | Muted/subtle text |
| accentPrimary | hex | Buttons, links, active elements |
| inlineCodeText | hex | Inline code text color |
| successColor | hex | Success indicators |
| borderColor | hex | All borders |
| codeBg | hex/rgba | Code block background (supports `rgba()`) |
| glassEffect | boolean | Enable glass effect on code blocks. Default: `true` (dark), `false` (light) |
| glowEffect | boolean | Enable glow on inline code. Default: `true` (dark), `false` (light) |

### Mode Independence

The theme is the single source of truth for light/dark mode. `cdp_full_theme.js` forces the correct body class and intercepts any attempt to change it back. The Appearance toggle in Settings has no effect.

Name your file descriptively (e.g. `dracula.json`, `nord.json`) and submit a PR.
