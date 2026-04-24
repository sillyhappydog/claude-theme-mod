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

### Going further: glass effect (CDP)

The screenshot above includes a translucent glass effect on code blocks that goes beyond what `theme.json` can express. This uses CSS `backdrop-filter` and `linear-gradient`, injected via Chrome DevTools Protocol.

If you want this level of customization, see the [CDP Access](../README.md#cdp-access-advanced) section in the main README. The key properties:

```css
/* Applied to code block wrappers (.group/copy elements) */
background: linear-gradient(180deg, rgba(0,255,40,0.08) 0%, rgba(0,255,40,0.04) 100%);
backdrop-filter: brightness(1.15);
border-top: 1px solid rgba(0,255,65,0.15);
box-shadow: 0 0 15px rgba(0,255,40,0.06), inset 0 1px 0 rgba(0,255,65,0.1);
```

## Contributing themes

Create a JSON file with any subset of the supported keys:

| Key | What it controls |
|---|---|
| bgMain | Main background |
| bgSidebar | Sidebar background |
| textPrimary | Primary text |
| textSecondary | Secondary text |
| textMuted | Muted/subtle text |
| accentPrimary | Buttons, links, active elements |
| inlineCodeText | Inline code text color |
| successColor | Success indicators |
| borderColor | All borders |
| codeBg | Code block background (supports `rgba()`) |

Name your file descriptively (e.g. `dracula.json`, `nord.json`) and submit a PR.
