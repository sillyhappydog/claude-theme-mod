# Restore original app.asar for Claude Desktop (Squirrel build)

$ErrorActionPreference = "Stop"

Write-Host "=== Claude Theme Restore ===" -ForegroundColor Cyan

# Step 1: Detect version directory
Write-Host "[1/3] Detecting Claude version directory..." -ForegroundColor Cyan
$claudeBase = Join-Path $env:LOCALAPPDATA "AnthropicClaude"
$appDir = Get-ChildItem $claudeBase -Directory -Filter "app-*" | Sort-Object Name | Select-Object -Last 1

if (-not $appDir) {
    Write-Host "ERROR: No app-* directory found in $claudeBase" -ForegroundColor Red
    exit 1
}

$resourcesDir = Join-Path $appDir.FullName "resources"
$targetAsar = Join-Path $resourcesDir "app.asar"
$backupAsar = Join-Path $resourcesDir "app.asar.backup"

Write-Host "  Found: $($appDir.Name)" -ForegroundColor Green

if (-not (Test-Path $backupAsar)) {
    Write-Host "ERROR: Backup not found at $backupAsar" -ForegroundColor Red
    Write-Host "  Cannot restore without a backup. Was deploy.ps1 run first?" -ForegroundColor Yellow
    exit 1
}

# Step 2: Stop Claude
Write-Host "[2/3] Stopping Claude..." -ForegroundColor Cyan
Get-Process -Name "claude" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 3: Restore backup
Write-Host "[3/3] Restoring original app.asar..." -ForegroundColor Cyan
Copy-Item $backupAsar $targetAsar -Force
Write-Host "  Restored!" -ForegroundColor Green

# Relaunch
Write-Host "Relaunching Claude..." -ForegroundColor Cyan
Start-Process (Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe")

Write-Host ""
Write-Host "Done. Original theme restored." -ForegroundColor DarkGray
