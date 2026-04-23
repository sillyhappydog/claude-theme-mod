# Deploy modified app.asar to Claude Desktop (Squirrel build)

param(
    [string]$AsarPath
)

$ErrorActionPreference = "Stop"

# Resolve asar source path
if (-not $AsarPath) {
    $AsarPath = Join-Path $PSScriptRoot "app.asar"
}

if (-not (Test-Path $AsarPath)) {
    Write-Host "ERROR: Modified asar not found at $AsarPath" -ForegroundColor Red
    exit 1
}

Write-Host "=== Claude Theme Deploy ===" -ForegroundColor Cyan

# Step 1: Detect version directory
Write-Host "[1/4] Detecting Claude version directory..." -ForegroundColor Cyan
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

# Step 2: Stop Claude
Write-Host "[2/4] Stopping Claude..." -ForegroundColor Cyan
Get-Process -Name "claude" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 3: Backup original asar
Write-Host "[3/4] Backing up original app.asar..." -ForegroundColor Cyan
if (-not (Test-Path $backupAsar)) {
    Copy-Item $targetAsar $backupAsar
    Write-Host "  Backup saved to $backupAsar" -ForegroundColor Green
} else {
    Write-Host "  Backup already exists, skipping" -ForegroundColor Yellow
}

# Step 4: Deploy modified asar
Write-Host "[4/4] Deploying modified app.asar..." -ForegroundColor Cyan
Copy-Item $AsarPath $targetAsar -Force
Write-Host "  Deployed!" -ForegroundColor Green

# Relaunch
Write-Host "Relaunching Claude..." -ForegroundColor Cyan
Start-Process (Join-Path $env:LOCALAPPDATA "AnthropicClaude\claude.exe")

Write-Host ""
Write-Host "Done. To restore the original, run restore.ps1" -ForegroundColor DarkGray
