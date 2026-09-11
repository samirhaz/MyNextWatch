$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath 'node_modules/next/dist/bin/next')) {
  throw 'Dependencies are missing. Open a terminal in this folder and run npm ci first.'
}
$chromePath = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
$appUrl = 'http://localhost:3000/signin'

# This optional portable server belongs only to this local workspace. Other users can use Compose.
$mysqlRoot = Join-Path $projectRoot '.local/mysql-8.4.11-winx64'
$mysqlData = Join-Path $projectRoot '.local/mysql-dev-data'
$usesPortableDatabase = (Test-Path -LiteralPath '.env') -and ((Get-Content -LiteralPath '.env' -Raw) -match '(?m)^DATABASE_URL="mysql://[^\r\n]+@127\.0\.0\.1:3306/mynextwatch"')
if ($usesPortableDatabase -and (Test-Path -LiteralPath $mysqlData) -and -not (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue)) {
  $mysqlArguments = @('--no-defaults', "--basedir=`"$mysqlRoot`"", "--datadir=`"$mysqlData`"", '--port=3306', '--bind-address=127.0.0.1', '--mysqlx=0', '--console', '--innodb-buffer-pool-size=64M')
  $bootstrap = Join-Path $projectRoot '.local/mysql-dev-bootstrap.sql'
  if (Test-Path -LiteralPath $bootstrap) { $mysqlArguments += "--init-file=`"$bootstrap`"" }
  Start-Process -FilePath (Join-Path $mysqlRoot 'bin/mysqld.exe') -ArgumentList $mysqlArguments -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot '.local/mysql-dev-stdout.log') -RedirectStandardError (Join-Path $projectRoot '.local/mysql-dev-stderr.log') | Out-Null
  $databaseReady = $false
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue) { $databaseReady = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $databaseReady) { throw 'MySQL did not start. Check .local/mysql-dev-stderr.log.' }
}

try { $existing = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3 } catch { $existing = $null }
if ($existing -and $existing.Content.Contains('MyNextWatch')) {
  if ($chromePath) { Start-Process -FilePath $chromePath -ArgumentList @('--new-tab', $appUrl) }
  Write-Host "MyNextWatch is already running: $appUrl"
  exit 0
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 3000 is occupied by another application. Stop it before starting MyNextWatch.' }

Write-Host "Starting MyNextWatch at $appUrl. Keep this window open; press Ctrl+C to stop the website."
$browserJob = Start-Job -ArgumentList $chromePath, $appUrl -ScriptBlock {
  param($browser, $url)
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        if ($browser) { Start-Process -FilePath $browser -ArgumentList @('--new-tab', $url) }
        break
      }
    } catch { }
    Start-Sleep -Seconds 1
  }
}
$websiteExitCode = 1
try { & npm.cmd run dev -- --hostname 127.0.0.1; $websiteExitCode = $LASTEXITCODE } finally { Stop-Job -Job $browserJob; Remove-Job -Job $browserJob }
exit $websiteExitCode
