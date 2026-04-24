# Claude Desktop Theme Mod — Setup Prompt

Paste this file into Claude Code and say "do this."

---

## What this does

Adds theme support to Claude Desktop. Once complete, you can change UI colors by editing `~/.claude/theme.json`. Changes are picked up automatically within \~1 second.

## Prerequisites check

Verify the following in order. If any fail, inform the user and stop.

1. **OS**: Windows 10/11
2. **Node.js**: v18+ (`node --version`)
3. **Claude Desktop**: Must be the Squirrel build (not MSIX)

How to check for Squirrel build:

```powershell
$squirrelExe = Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe"
if (Test-Path $squirrelExe) { "OK: Squirrel build detected" } else { "FAIL: Likely MSIX build. Run: winget install Anthropic.Claude" }
```

## Setup steps

### Step 1: Clone the repo

```powershell
cd $env:USERPROFILE
git clone https://github.com/sillyhappydog/claude-theme-mod.git
cd claude-theme-mod
npm install
```

### Step 2: Flip Electron fuses

```powershell
node tools/flip_fuses.js
```

Verify with `node tools/read_fuses.js`. Confirm both:

- `EnableNodeCliInspectArguments`: ON
- `EnableEmbeddedAsarIntegrityValidation`: OFF (disabled)

### Step 3: Close Claude Desktop, then inject the theme loader

```powershell
Get-Process -Name "claude" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
node tools/inject_theme_loader.js
```

Confirm all injection points appear in the output:

- `[Point A]` Theme loader appended
- `[Point B]` dom-ready handler patched
- `[Point C]` GLt background color
- `[Point D]` QyA BrowserWindow background
- `[Point E]` setBackgroundColor
- `[Point F]` Argv guard patched (CDP enabled)
- `[Shell]` index.html patched

Claude Desktop restarts automatically when the injector finishes.

### Step 4: Create a theme file

```powershell
$themePath = Join-Path $env:USERPROFILE ".claude\theme.json"
$themeDir = Split-Path $themePath
if (-not (Test-Path $themeDir)) { New-Item -ItemType Directory -Path $themeDir -Force }

@'
{
  "name": "Matrix",
  "bgMain": "#0A0A0A",
  "bgSidebar": "#050505",
  "textPrimary": "#00FF41",
  "textSecondary": "#00CC33",
  "textMuted": "#008F26",
  "accentPrimary": "#00FF41",
  "inlineCodeText": "#FF6B6B",
  "successColor": "#00FF41",
  "borderColor": "#0A3A0A",
  "codeBg": "rgba(0,255,10,0.05)"
}
'@ | Set-Content $themePath -Encoding UTF8
```

The theme applies automatically within \~1 second.

### Step 5: Verify

Confirm that Claude Desktop's appearance has changed. Ask the user: "Has the theme been applied?"

## Theme keys

KeyDescriptionExamplebgMainMain background color#0A0A0AbgSidebarSidebar background color#050505textPrimaryPrimary text color#00FF41textSecondarySecondary text color#00CC33textMutedMuted text color#008F26accentPrimaryAccent color (buttons, links, etc.)#00FF41inlineCodeTextInline code text color#FF6B6BsuccessColorSuccess indicator color#00FF41borderColorBorder color#0A3A0AcodeBgCode block background (supports rgba)rgba(0,255,10,0.05)

## Reverting

```powershell
cd $env:USERPROFILE\claude-theme-mod
.\tools\restore.ps1
```

## Troubleshooting

- **Claude Desktop won't launch**: Run `.\tools\restore.ps1`
- **Theme not applying**: Restart Claude Desktop. If that doesn't work, re-run `node tools/inject_theme_loader.js`
- **Wrong build (MSIX)**: Switch to Squirrel build with `winget install Anthropic.Claude`, then start over
- **Auto-update reset everything**: Re-run `node tools/flip_fuses.js` then `node tools/inject_theme_loader.js`
