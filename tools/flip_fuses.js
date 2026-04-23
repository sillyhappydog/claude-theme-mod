const { flipFuses, FuseV1Options, FuseVersion } = require('@electron/fuses');
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
    console.log('Flipping fuses:');
    console.log('  EnableNodeCliInspectArguments: DISABLED -> ENABLED');
    console.log('  EnableEmbeddedAsarIntegrityValidation: ENABLED -> DISABLED');
    console.log('');

    await flipFuses(electronBinary, {
        version: FuseVersion.V1,
        [FuseV1Options.EnableNodeCliInspectArguments]: true,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
    });

    console.log('Fuses flipped successfully.');
}

main().catch(e => {
    console.error('Failed:', e.message);
    process.exit(1);
});
