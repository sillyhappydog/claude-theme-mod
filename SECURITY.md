# Security

## What this repository shares

This repository documents **techniques** for modifying Claude Desktop's Electron build. It does not include any proprietary Anthropic code, pre-modified binaries, or ready-made exploits.

The tools provided (fuse flipping, asar extraction/repacking) use publicly available Electron APIs (`@electron/fuses`, `@electron/asar`) that are maintained by the Electron project itself.

## Risk assessment

Modifying an Electron app's asar archive rarely creates a **new** privilege boundary — if an attacker already has code execution at your user level, they can do everything asar modification enables and more. However, asar modification does materially change the risk profile in specific scenarios:

| Scenario | Additional risk | Why |
|---|---|---|
| Same-user file write only (no code execution) | **Medium-High** | Attacker can trojan the asar to gain code execution on next app launch |
| Same-user code execution already obtained | **Low-Medium** | Asar modification adds stealth and persistence but no new capabilities |
| Supply chain / trojanized installer | **HIGH** | Pre-modified binaries from untrusted sources can contain anything — keyloggers, credential stealers, remote access tools |

The highest real-world risk is **supply chain attacks**: someone distributing a "pre-modded Claude" installer that contains malicious code alongside the cosmetic changes.

## Share the knowledge, not the binary

This is why we follow one principle:

**Never distribute pre-modified binaries.** Each user should:

1. Install Claude Desktop themselves (`winget install Anthropic.Claude`)
2. Run the fuse-flipping tools themselves
3. Modify their own asar with their own theme
4. Understand what each step does before running it

When you build it yourself from documented steps, you can verify every change. When you download someone else's binary, you're trusting them completely.

## For users

- **DO** read the [Implementation Log](docs/IMPLEMENTATION_LOG.md) to understand what's happening
- **DO** back up your original `app.asar` and `claude.exe` before any modification
- **DO** verify the Squirrel installer SHA256 hash before running it (see [docs/SQUIRREL_INSTALLER.md](docs/SQUIRREL_INSTALLER.md))
- **DON'T** download pre-modified Claude Desktop installers from anyone
- **DON'T** download pre-built asar files from untrusted sources
- **DON'T** run fuse-flipping scripts you haven't read

## Fuse modification and code signing

Flipping Electron fuses is a binary patch that invalidates the application's code signature. This is an intentional and expected consequence — Electron fuses exist precisely to allow or restrict capabilities at the binary level. However, an unsigned or invalidly-signed binary may trigger warnings from security software.

## Responsible disclosure

If you discover a security issue with the techniques documented here that goes beyond cosmetic theming — for example, a way to escalate privileges or exfiltrate data — please open an issue describing the concern, or contact the repository maintainers directly.
