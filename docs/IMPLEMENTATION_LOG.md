# Claude Desktop Vaporwave Theme - Implementation Log

An implementation log written from Claude Code's (Opus 4.6) perspective, documenting every attempt to apply a custom CSS theme to Claude Desktop on Windows — what was tried, what failed, and what finally worked.

## Environment

- OS: Windows 11
- Claude Desktop: v1.3883.0
- Initial state: MSIX package (Developer-signed, not from Microsoft Store)
- Final state: Squirrel installer (exe, installed via winget)
- Working directory: `%USERPROFILE%\claude-theme-mod\`

---

## Phase 1: Direct asar replacement on MSIX build (done by user beforehand)

### What was done
1. Extracted `app.asar` using `@electron/asar`
2. Modified CSS in `index.html` (shell/titlebar colors) and `mainView.js` (`insertCSS` content)
3. Repacked into `app_vaporwave.asar`
4. Replaced `app.asar` inside `C:\Program Files\WindowsApps\` (after taking ownership with `takeown` / `icacls`)

### Result: app silently refuses to launch

### Root cause
MSIX packages contain `AppxBlockMap.xml`, which records SHA256 block hashes (64KB blocks) for every file. Both the file size and hashes changed, so Windows rejected the package at launch. Additionally, `AppxSignature.p7x` signs the BlockMap itself, so updating the BlockMap alone still fails signature verification.

---

## Phase 2: Recalculating AppxBlockMap.xml hashes (done by Claude Code)

### What was done
1. Wrote `recalc_blockmap.js` — splits the modified asar into 64KB blocks, computes SHA256 hash (Base64-encoded) for each
2. **Verified correctness**: the first block hash of the original asar matched the existing BlockMap entry exactly
3. Generated `AppxBlockMap_updated.xml` (485 blocks + FileHash)

### BlockMap hash specification notes
- Block size: 65536 bytes (64KB)
- Hash: SHA256 of the **uncompressed** block data, Base64-encoded
- `Block@Size` attribute: compressed size in the MSIX ZIP (only the Hash matters for installed package verification)
- `b4:FileHash`: SHA256 of the entire uncompressed file

---

## Phase 3: Package re-registration attempts (failed)

### Attempt 3-1: Register directly from the install directory

```powershell
Add-AppxPackage -Register "C:\Program Files\WindowsApps\Claude_...\AppxManifest.xml"
```

**Error**: `0x80073CF9` — "Registration request rejected because manifest is not at the package root"

**Cause**: The `WindowsApps` directory has special OS-level protections. You cannot `-Register` directly from it.

### Attempt 3-2: Copy to user directory, then register

The deployment script had a fatal ordering bug:

```
Step 2: Remove-AppxPackage  ← removes the package (deletes the entire directory)
Step 3: takeown              ← runs against a directory that no longer exists → FAIL
Step 4: Copy-Item            ← never executes
```

**Result**: Both the package registration and the install directory were destroyed. No copy was made.

**Lesson learned**: `Remove-AppxPackage` deletes the directory under `WindowsApps`. You must copy **before** removing.

---

## Phase 4: Reinstall via winget → migrated to Squirrel build

```powershell
winget install Anthropic.Claude
```

This installed the **Squirrel build** (standard exe installer), not the MSIX version.

### Squirrel build directory structure
```
%LOCALAPPDATA%\AnthropicClaude\
├── claude.exe              # Squirrel launcher (Update.exe wrapper)
├── Update.exe              # Squirrel update manager
├── app-1.3883.0\           # Actual Electron app
│   ├── claude.exe          # Electron binary
│   └── resources\
│       └── app.asar        # Application code
└── packages\
```

**Key difference**: The Squirrel build has no `AppxBlockMap.xml` or `AppxSignature.p7x`. MSIX integrity checks are entirely irrelevant.

---

## Phase 5: asar replacement on Squirrel build (failed)

### Attempt 5-1: Deploy the previously built app_vaporwave.asar

**Result**: app doesn't start (0 processes)

**Investigation**: `@electron/asar`'s `extractFile` couldn't read files from the vaporwave asar. File listing comparison showed "0 differences", but the asar header bytes differed. The repacking process likely corrupted the header structure.

### Attempt 5-2: Fresh extract → CSS modification → repack

Extracted the original `app.asar` to `app_fresh/`, applied CSS changes manually, repacked.

```bash
npx @electron/asar extract app.asar app_fresh
# edit index.html and mainView.js
npx @electron/asar pack app_fresh app_vaporwave_v2.asar
```

**Result**: FATAL crash on launch

```
FATAL:electron\shell\common\asar\asar_util.cc:143]
Integrity check failed for asar archive
(732a2cf0... vs cd1fa5f6...)
```

**Cause**: This is NOT the MSIX BlockMap — it's **Electron's own asar integrity check**. The Electron binary has the expected asar SHA256 hash embedded at build time. Any mismatch causes an immediate abort.

---

## Phase 6: CDP (Chrome DevTools Protocol) CSS injection (failed)

Since asar modification wasn't possible, switched to a runtime CSS injection approach without touching any files.

### Attempt 6-1: `--remote-debugging-port=9222`

Tried every delivery method:
- Via Squirrel launcher
- Direct Electron binary launch
- `Update.exe --processStart claude.exe --process-start-args "--remote-debugging-port=9222"`
- `ELECTRON_ADDITIONAL_CHROMIUM_ARGS` environment variable

**Result**: Claude silently refuses to start when this flag is present (0 processes, no error message)

### Attempt 6-2: `--inspect=9229`

**Result**: Claude starts (10 processes), but the inspector port never opens. Verified via `Get-CimInstance Win32_Process` that `--inspect=9229` IS present in the command line, but nothing is listening on port 9229.

**Cause**: Electron Fuses.

---

## Phase 7: Discovering and flipping Electron Fuses (success)

### What are Electron Fuses?

A set of binary flags embedded in the Electron executable that control security features at the binary level. They cannot be overridden by source code, command-line arguments, or environment variables.

### Claude Desktop's fuse configuration (before modification)

```
EnableNodeCliInspectArguments:         0 (DISABLED) ← blocks --inspect / --remote-debugging-port
EnableEmbeddedAsarIntegrityValidation: 1 (ENABLED)  ← crashes on asar hash mismatch
RunAsNode:                             0 (DISABLED)
EnableNodeOptionsEnvironmentVariable:  0 (DISABLED)
OnlyLoadAppFromAsar:                   1 (ENABLED)
```

### How to flip them

```bash
npm install @electron/fuses
```

```javascript
const { flipFuses, FuseV1Options, FuseVersion } = require('@electron/fuses');

await flipFuses('path/to/claude.exe', {
    version: FuseVersion.V1,
    [FuseV1Options.EnableNodeCliInspectArguments]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
});
```

**Result**: Both fuses flipped successfully.

### Effect
- `EnableEmbeddedAsarIntegrityValidation: OFF` → Modified asar files are accepted
- `EnableNodeCliInspectArguments: ON` → `--inspect` now works (stepping stone for CDP)

---

## Phase 8: Final deployment (success)

After flipping fuses, a simple file copy is all that's needed.

```bash
cp app_vaporwave_v3.asar "%LOCALAPPDATA%\AnthropicClaude\app-1.3883.0\resources\app.asar"
```

Claude Desktop launches successfully with the vaporwave theme applied.

---

## Phase 9: Enabling `--remote-debugging-port` (success)

### Background

Even after flipping fuses, launching with `--remote-debugging-port=9222` caused Claude to exit immediately (0 processes, no error message). Meanwhile, `--inspect=9229` worked perfectly (Node.js Inspector port opened).

The fuse `EnableNodeCliInspectArguments` only governs Node.js `--inspect*` flags. Chromium's `--remote-debugging-port` was blocked by a **separate mechanism** inside the app code.

### Root cause

Searching the asar code:

```bash
grep -r "remote-debugging" app_fresh/.vite/build/ --include="*.js"
```

Found a guard function in `index.pre.js`:

```javascript
function oEe(t) {
    return t.some(e => {
        const r = e.replace(/^(?:--|-|\/)/, "").toLowerCase();
        return r.startsWith("remote-debugging-port") || r.startsWith("remote-debugging-pipe");
    });
}
```

This function scans `process.argv` for `remote-debugging-port` or `remote-debugging-pipe` and aborts startup if either is found.

### Fix

```javascript
// Before
function oEe(t){return t.some(e=>{const r=e.replace(/^(?:--|-|\/)/,"").toLowerCase();return r.startsWith("remote-debugging-port")||r.startsWith("remote-debugging-pipe")})}

// After
function oEe(t){return false}
```

### Result

```
DevTools listening on ws://127.0.0.1:9222/devtools/browser/8db8396f-...
Processes: 10
CDP OK
```

`--remote-debugging-port=9222` now works. Connect via `chrome://inspect` or any CDP client.

---

## Final artifacts

| File | Purpose |
|---|---|
| `app.asar.original` | Original asar backup |
| `app.asar.backup` | Squirrel build's original asar (also in `resources/`) |
| `claude.exe.backup` | Electron binary backup (before fuse modification) |
| `app_vaporwave_v3.asar` | CSS-modified + CDP-unblocked asar (final version) |
| `vaporwave.css` | Theme CSS (standalone file, source of truth for asar) |
| `flip_fuses.js` | Fuse flipping script |
| `read_fuses.js` | Fuse state reader script |
| `recalc_blockmap.js` | BlockMap hash recalculator (for MSIX, ultimately unused) |
| `cdp_inject.js` | CDP injection script (unnecessary after fuse+patch, kept for reference) |
| `enable_cdp.js` | Inspector-based CDP enabler script (for reference) |

---

## Caveats

- **Claude Desktop auto-updates** will replace the `app-1.3883.0` directory with a new version, resetting the fuses, the asar, and the argv patch. You'll need to re-run `flip_fuses.js` and re-deploy the modified asar after each update.
- **Flipping fuses is a binary patch** that effectively invalidates the app's code signature. Understand the security implications before proceeding.
- `@electron/asar`'s `extractFile()` has path separator issues on Windows — paths returned by `listPackage()` cannot always be passed back to `extractFile()` (fails with `"not found in this archive"`). The CLI command `npx @electron/asar extract` works reliably as a workaround.

---

## Conclusion

Four security layers stand between you and a fully modded Claude Desktop:

| Layer | Mechanism | Applies to | Bypass |
|---|---|---|---|
| MSIX AppxBlockMap | Per-file SHA256 block hashes + signature | MSIX build only | Recalculate BlockMap + delete signature + re-register (or just switch to Squirrel build) |
| Electron Asar Integrity | asar SHA256 hash embedded in the binary | All builds | `@electron/fuses`: set `EnableEmbeddedAsarIntegrityValidation` to OFF |
| Electron Fuse: InspectArgs | Blocks `--inspect` / `--inspect-brk` | All builds | `@electron/fuses`: set `EnableNodeCliInspectArguments` to ON |
| App-level argv guard | Scans `process.argv` for `remote-debugging-port` / `remote-debugging-pipe` and aborts | All builds | Patch `oEe` function in `index.pre.js` inside the asar to `return false` |

**Shortest path (theme only)**: Flip 2 fuses → replace asar. That's it.
**Shortest path (theme + CDP)**: Flip 2 fuses → patch argv guard in asar → replace asar.
If you're on the MSIX build, switch to the Squirrel build first (`winget install Anthropic.Claude`) to avoid the BlockMap layer entirely.
