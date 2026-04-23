const { FuseV1Options, getCurrentFuseWire } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

const claudeBase = path.join(process.env.LOCALAPPDATA, 'AnthropicClaude');
const appDir = fs.readdirSync(claudeBase)
    .filter(d => d.startsWith('app-') && fs.statSync(path.join(claudeBase, d)).isDirectory())
    .sort()
    .pop();

if (!appDir) {
    console.error('ERROR: No app-* directory found in', claudeBase);
    process.exit(1);
}

console.log('  Version:', appDir);

const electronBinary = path.join(claudeBase, appDir, 'claude.exe');

async function main() {
    console.log('Binary:', electronBinary);
    console.log('');

    const wire = await getCurrentFuseWire(electronBinary);

    const fuseNames = Object.entries(FuseV1Options)
        .filter(([k, v]) => typeof v === 'number')
        .sort((a, b) => a[1] - b[1]);

    console.log('Fuse Configuration:');
    for (const [name, index] of fuseNames) {
        const state = wire[index];
        const label = state === '1' ? 'ENABLED' : state === '0' ? 'DISABLED' : `REMOVED(${state})`;
        console.log(`  [${index}] ${name}: ${label}`);
    }
}

main().catch(console.error);
