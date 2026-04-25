# Claude Desktop v1.4758.0 Upgrade - Implementation Log

Implementation log documenting the upgrade from Claude Desktop v1.3883.0 to v1.4758.0, and the steps required to restore CDP access and theme functionality.

## Environment

- OS: Windows 11
- Claude Desktop: v1.3883.0 → v1.4758.0 (auto-update)
- Installer: Squirrel (exe, installed via winget)
- Theme system: v0.7 (CDP-based injection via `cdp_full_theme.js`)
- Working directory: `<REPO_DIR>` (clone of sillyhappydog/claude-theme-mod)

---

## What broke

Claude Desktop auto-updated from v1.3883.0 to v1.4758.0. This replaced:
- `app-1.3883.0\claude.exe` → `app-1.4758.0\claude.exe` (new Electron binary, fresh fuses)
- `app-1.3883.0\resources\app.asar` → `app-1.4758.0\resources\app.asar` (new app code)

All previous modifications were lost:
1. **Fuse flips** — new binary has factory-default fuses (CDP blocked, asar integrity enabled)
2. **argv guard patch** — new asar has unpatched `index.pre.js`
3. **Theme loader injection** — new asar has unpatched `index.js`

The theme system (v0.7) uses CDP for runtime injection and does not require asar modification for theming. However, CDP access requires fuse flips and argv guard patching.

---

## Step 1: Fuse flip — EnableNodeCliInspectArguments

### What was done

```javascript
const { flipFuses, FuseV1Options, FuseVersion } = require('@electron/fuses');

await flipFuses('%LOCALAPPDATA%/AnthropicClaude/app-1.4758.0/claude.exe', {
  version: FuseVersion.V1,
  [FuseV1Options.EnableNodeCliInspectArguments]: true,
});
```

### Result

```
Fuse flipped: EnableNodeCliInspectArguments = true
Fuse wire index 3: 49 (ASCII '1' = enabled)
```

This alone was insufficient — Claude still refused to start with `--remote-debugging-port=9222`.

---

## Step 2: argv guard identification and patching

### Problem

Even with the fuse flipped, `--remote-debugging-port=9222` caused Claude to silently exit (0 processes, no error). The fuse controls Node.js `--inspect*` flags; the `--remote-debugging-port` flag is blocked by a separate guard function in the application code.

### Investigation

```bash
grep -r "remote-debugging-port" app_work_v2/.vite/build/ --include="*.js"
# Found in: index.pre.js
```

The guard function name changed from v1.3883.0:

| Version | Function name | Location |
|---|---|---|
| v1.3883.0 | `oEe(t)` | `index.pre.js` |
| v1.4758.0 | `uF(t)` | `index.pre.js` |

Function body is identical:

```javascript
function uF(t) {
  return t.some(e => {
    const r = e.replace(/^(?:--|-|\/)/, "").toLowerCase();
    return r.startsWith("remote-debugging-port") || r.startsWith("remote-debugging-pipe");
  });
}
```

### Fix

```javascript
// Before
function uF(t){return t.some(e=>{const r=e.replace(/^(?:--|-|\/)/,"").toLowerCase();return r.startsWith("remote-debugging-port")||r.startsWith("remote-debugging-pipe")})}

// After
function uF(t){return false}
```

Patched via Node.js string replacement, then repacked with `@electron/asar`.

### Result: Claude still refused to start

The patched asar was rejected at launch — no processes, no error. Asar integrity validation was blocking the modified file.

---

## Step 3: Fuse flip — EmbeddedAsarIntegrityValidation

### Root cause

The fuse wire showed `[4] AsarIntegrity = ENABLED`. The Electron binary has the expected asar SHA256 hash embedded at build time. Any modification to `app.asar` causes an integrity check failure and immediate abort.

### Full fuse state (v1.4758.0, after all flips)

```
[0] RunAsNode                          = DISABLED (48)
[1] CookieEncryption                   = ENABLED  (49)
[2] NodeOptions                        = DISABLED (48)
[3] NodeCliInspect                     = ENABLED  (49) ← flipped in Step 1
[4] EmbeddedAsarIntegrityValidation    = DISABLED (48) ← flipped in Step 3
[5] OnlyLoadAppFromAsar               = ENABLED  (49)
[6] LoadBrowserProcessSpecificV8Snap   = DISABLED (48)
[7] GrantFileProtocolExtraPrivileges   = ENABLED  (49)
[8] (index 8)                         = ENABLED  (49)
```

### Fix

```javascript
await flipFuses(exe, {
  version: FuseVersion.V1,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
});
```

### Result

Claude Desktop launched successfully with `--remote-debugging-port=9222`. CDP targets returned:

```json
[
  { "title": "index.html",      "url": "file:///.../main_window/index.html" },
{ "title": "Claude", "url": "<https://claude.ai/new>" }, { "title": "find-in-page.html", "url": "file:///.../find_in_page/find-in-page.html" } \]

```

---

## Step 4: Theme application

```bash
cd <REPO_DIR> && node tools/cdp_full_theme.js
```

### Result

```
Theme: "Threed" | Mode: dark
Shell: v0.7 Shell [dark]
Content: v0.7 Content [dark] glass:true glow:true (no polling)
```
Theme fully applied — CSS variables, glass effect on code blocks, gold glow on inline code.

---

## Summary: v1.3883.0 → v1.4758.0 differences

| Aspect | v1.3883.0 | v1.4758.0 |
|---|---|---|
| App directory | `app-1.3883.0` | `app-1.4758.0` |
| argv guard function | `oEe(t)` | `uF(t)` |
| argv guard location | `index.pre.js` | `index.pre.js` (same) |
| argv guard logic | identical | identical |
| Fuses required | NodeCliInspect + AsarIntegrity | NodeCliInspect + AsarIntegrity (same) |
| Theme system | v0.5 (asar-injected) → v0.7 (CDP) | v0.7 (CDP, unchanged) |

### What stays the same
- Fuse positions and semantics (same Electron fuse wire format)
- argv guard logic (same pattern, different minified name)
- CDP target structure (Shell, Content, find-in-page)
- Theme injection method (CDP WebSocket → Runtime.evaluate)

### What changed
- Minified function names (`oEe` → `uF`, etc.)
- App directory name (`app-1.3883.0` → `app-1.4758.0`)

---

## Procedure for future updates

When Claude Desktop auto-updates to a new version:

1. **Find the new app directory**: `ls %LOCALAPPDATA%\AnthropicClaude\app-*`
2. **Flip two fuses** on the new `claude.exe`:
   - `EnableNodeCliInspectArguments`: true
   - `EnableEmbeddedAsarIntegrityValidation`: false
3. **Extract asar, find and patch argv guard**:
   - `grep "remote-debugging-port" index.pre.js` to find the guard function
   - Replace with `return false`
   - Repack and deploy
4. **Launch with CDP**: `Start-Process claude.exe -ArgumentList "--remote-debugging-port=9222"`
5. **Apply theme**: `node tools/cdp_full_theme.js`

The guard function name will change with each build (minification), but the pattern (`t.some(e => ... r.startsWith("remote-debugging-port") ...)`) remains stable and searchable.
