# Launch Claude Desktop with Chrome DevTools Protocol enabled
$claudeBase = Join-Path $env:LOCALAPPDATA "AnthropicClaude"
$appDir = Get-ChildItem $claudeBase -Directory -Filter "app-*" | Sort-Object Name | Select-Object -Last 1

if (-not $appDir) {
    Write-Host "ERROR: No app-* directory found" -ForegroundColor Red
    exit 1
}

$exe = Join-Path $appDir.FullName "claude.exe"
Write-Host "Launching with CDP on port 9222..." -ForegroundColor Cyan
Write-Host "  Binary: $exe" -ForegroundColor DarkGray
Start-Process $exe -ArgumentList "--remote-debugging-port=9222"
Write-Host "DevTools available at: http://localhost:9222" -ForegroundColor Green
Write-Host "Open chrome://inspect in Chrome to connect." -ForegroundColor DarkGray
