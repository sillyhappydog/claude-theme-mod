# Claude Desktop Squirrel Installer Archive

## ⚠️ SAVE THIS BEFORE ANTHROPIC KILLS IT

Browser download → MSIX (locked down)
winget install  → Squirrel/exe (moddable)

Same version, different packaging. This exe is the key to modding.

## v1.4758.0 (Current as of 2026-04-25)

- Type: Squirrel nupkg (auto-updated from v1.3883.0)
- Nupkg URL: https://downloads.claude.ai/releases/win32/x64/AnthropicClaude-1.4758.0-full.nupkg
- SHA256: 37A18DCD0BFBE21331978ECFD28EA2F1C6574572710659CC6D65E2B695A9C283
- SHA1 (RELEASES): 4D890BBB03B53CE1C3CD0C60F5023CC3A07B64C3
- Install path: %LOCALAPPDATA%\AnthropicClaude\app-1.4758.0\
- argv guard function: `uF(t)` in index.pre.js

## v1.3883.0

- Type: exe (Squirrel initial install)
- URL: https://downloads.claude.ai/releases/win32/x64/1.3883.0/Claude-93ff6cb984386882b4bd9b6bca80d4cf5af8e13b.exe
- SHA256: 13fa53ddea0a362e4b91d289c7e9f1186039b79963b5a8e31409e31cac1bb591
- Install path: %LOCALAPPDATA%\AnthropicClaude\app-1.3883.0\
- argv guard function: `oEe(t)` in index.pre.js

## URL patterns

### Initial install (exe)
```
https://downloads.claude.ai/releases/win32/x64/{VERSION}/Claude-{COMMIT_HASH}.exe
```

### Squirrel update (nupkg)
```
https://downloads.claude.ai/releases/win32/x64/AnthropicClaude-{VERSION}-full.nupkg
```

### Update channel (RELEASES check)
```
https://api.anthropic.com/api/desktop/win32/x64/squirrel/update/RELEASES
  ?device_id={UUID}&id=AnthropicClaude&localVersion={VERSION}&arch=amd64
```

## Why this matters
- No AppxBlockMap.xml (no MSIX integrity check)
- No AppxSignature.p7x (no package signature)
- app.asar lives in a user-writable directory
- Only barrier: Electron Fuses (flipFuses with @electron/fuses)

## Modding shortest path

1. winget install Anthropic.Claude
2. node flip_fuses.js (disable asar integrity, enable inspect)
3. asar extract → patch argv guard + 3-patch (setThemeMode/HSA/ext) → repack
4. Launch with --remote-debugging-port=9222
5. node cdp_full_theme.js

## Disable auto-update

Rename Update.exe to prevent Squirrel from checking for updates:

```powershell
Rename-Item "$env:LOCALAPPDATA\AnthropicClaude\Update.exe" "Update.exe.disabled"
```

To re-enable:

```powershell
Rename-Item "$env:LOCALAPPDATA\AnthropicClaude\Update.exe.disabled" "Update.exe"
```

## Version history / auto-update flow

```
v1.3883.0 (initial Squirrel install via winget)
    ↓ auto-update (app close triggers Squirrel)
```
```
```
```
```
```
```
```
```
v1.4758.0 (nupkg download → extracted to app-1.4758.0)
    ↓ all patches reset, re-patch required
```
