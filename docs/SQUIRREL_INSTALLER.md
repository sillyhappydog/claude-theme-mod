# Claude Desktop Squirrel Installer Archive

## ⚠️ SAVE THIS BEFORE ANTHROPIC KILLS IT

Browser download → MSIX (locked down)
winget install  → Squirrel/exe (moddable)

Same version, different packaging. This exe is the key to modding.

## v1.3883.0 (Current as of 2026-04-24)

- Type: exe (Squirrel)
- URL: https://downloads.claude.ai/releases/win32/x64/1.3883.0/Claude-93ff6cb984386882b4bd9b6bca80d4cf5af8e13b.exe
- SHA256: 13fa53ddea0a362e4b91d289c7e9f1186039b79963b5a8e31409e31cac1bb591
- Install path: %LOCALAPPDATA%\AnthropicClaude\

## URL pattern
https://downloads.claude.ai/releases/win32/x64/{VERSION}/Claude-{COMMIT_HASH}.exe

## Why this matters
- No AppxBlockMap.xml (no MSIX integrity check)
- No AppxSignature.p7x (no package signature)
- app.asar lives in a user-writable directory
- Only barrier: Electron Fuses (flipFuses with @electron/fuses)

## Modding shortest path
1. winget install Anthropic.Claude
2. node flip_fuses.js  (disable asar integrity, enable inspect)
3. Replace app.asar with modded version
4. Done.
