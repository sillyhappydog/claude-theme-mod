# Launch Claude Desktop with theme — one-click startup
# Starts Claude with CDP, waits for load, applies full theme via CDP WebSocket

$ErrorActionPreference = "Stop"

# Find Claude exe
$claudeBase = Join-Path $env:LOCALAPPDATA "AnthropicClaude"
$appDir = Get-ChildItem $claudeBase -Directory -Filter "app-*" | Sort-Object Name | Select-Object -Last 1
$exe = Join-Path $appDir.FullName "claude.exe"

# Kill existing instance
Get-Process -Name "claude" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Launch with CDP — must use versioned exe directly, NOT Squirrel launcher
# Squirrel launcher (top-level claude.exe) swallows CLI arguments
Write-Host "Starting Claude Desktop with CDP..." -ForegroundColor Cyan
Start-Process $exe -ArgumentList "--remote-debugging-port=9222"

# Wait for CDP to be ready
Write-Host "Waiting for CDP..." -ForegroundColor DarkGray
$maxRetries = 20
for ($i = 0; $i -lt $maxRetries; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:9222/json' -UseBasicParsing -TimeoutSec 2
        $targets = $r.Content | ConvertFrom-Json
        $claude = $targets | Where-Object { $_.url -match 'claude.ai' }
        if ($claude) {
            Write-Host "  Claude.ai target found (wc=$($claude.id))" -ForegroundColor Green
            break
        }
    } catch { }
    if ($i -eq $maxRetries - 1) {
        Write-Host "ERROR: CDP not ready after $maxRetries seconds" -ForegroundColor Red
        exit 1
    }
}

# Wait for page to fully load
Write-Host "Waiting for page load..." -ForegroundColor DarkGray
Start-Sleep -Seconds 3

# Apply full theme via CDP
Write-Host "Applying theme..." -ForegroundColor Cyan
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$themeTool = Join-Path $scriptDir "cdp_full_theme.js"

if (-not (Test-Path $themeTool)) {
    Write-Host "ERROR: cdp_full_theme.js not found at $themeTool" -ForegroundColor Red
    exit 1
}

# Run theme injection
Push-Location (Split-Path $scriptDir -Parent)
node $themeTool
Pop-Location

Write-Host ""
Write-Host "Done! Theme applied. CDP remains open on port 9222." -ForegroundColor Green
Write-Host "To re-apply after navigation: node $themeTool" -ForegroundColor DarkGray
