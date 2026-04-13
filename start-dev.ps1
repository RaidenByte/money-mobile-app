param(
  [switch]$NoOpenApp
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host "[STEP] $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
  Write-Host "[OK]   $msg" -ForegroundColor Green
}

function Write-WarnMsg($msg) {
  Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Get-ListeningPid([int]$port) {
  try {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop | Select-Object -First 1
    return $conn.OwningProcess
  } catch {
    return $null
  }
}

function Wait-ForHealth([string]$url, [int]$maxSeconds) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $maxSeconds) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 800
    }
  }
  return $false
}

function Resolve-AdbPath() {
  $candidates = @(@(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe",
    "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) })

  if ($candidates.Count -gt 0) {
    return $candidates[0]
  }

  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  return $null
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root "apps\api"
$mobileDir = Join-Path $root "apps\mobile"

if (-not (Test-Path $apiDir)) {
  throw "Missing directory: $apiDir"
}
if (-not (Test-Path $mobileDir)) {
  throw "Missing directory: $mobileDir"
}

Write-Step "Checking API (port 3000)"
$apiPid = Get-ListeningPid 3000
if ($apiPid) {
  Write-Ok "API already running on 3000 (PID: $apiPid)"
} else {
  Write-Step "Starting API server"
  $apiLog = Join-Path $apiDir "api-dev.log"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev > api-dev.log 2>&1" -WorkingDirectory $apiDir | Out-Null
  if (Wait-ForHealth "http://localhost:3000/health" 25) {
    Write-Ok "API is healthy: http://localhost:3000/health"
  } else {
    Write-WarnMsg "API health check timed out. Check log: $apiLog"
  }
}

Write-Step "Checking Metro (port 8081)"
$metroPid = Get-ListeningPid 8081
if ($metroPid) {
  Write-Ok "Metro already running on 8081 (PID: $metroPid)"
} else {
  Write-Step "Starting Metro for dev-client"
  $metroLog = Join-Path $mobileDir "metro.log"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx expo start --dev-client --port 8081 > metro.log 2>&1" -WorkingDirectory $mobileDir | Out-Null
  Start-Sleep -Seconds 4
  $metroPid = Get-ListeningPid 8081
  if ($metroPid) {
    Write-Ok "Metro is running on 8081 (PID: $metroPid)"
  } else {
    Write-WarnMsg "Metro may still be starting. Check log: $metroLog"
  }
}

$adb = Resolve-AdbPath
if (-not $adb) {
  Write-WarnMsg "ADB not found. Install Android SDK Platform-Tools or add adb to PATH."
  exit 0
}

Write-Step "Checking Android device"
$deviceLines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
$authorized = $deviceLines | Where-Object { $_ -match "\sdevice$" }
$unauthorized = $deviceLines | Where-Object { $_ -match "\sunauthorized$" }

if ($authorized.Count -eq 0) {
  if ($unauthorized.Count -gt 0) {
    Write-WarnMsg "Device unauthorized. Please allow USB debugging on your phone screen."
  } else {
    Write-WarnMsg "No Android device connected."
  }
  Write-Host ""
  Write-Host "Current adb devices output:"
  & $adb devices
  exit 0
}

Write-Ok "Authorized device detected"

Write-Step "Applying adb reverse (3000, 8081)"
& $adb reverse tcp:3000 tcp:3000 | Out-Null
& $adb reverse tcp:8081 tcp:8081 | Out-Null
Write-Ok "adb reverse completed"

if (-not $NoOpenApp) {
  Write-Step "Opening app on phone"
  & $adb shell monkey -p com.anonymous.mobile -c android.intent.category.LAUNCHER 1 | Out-Null
  Write-Ok "Launch signal sent to com.anonymous.mobile"
}

Write-Host ""
Write-Host "Done. Useful logs:"
Write-Host "  API:   $apiDir\api-dev.log"
Write-Host "  Metro: $mobileDir\metro.log"
Write-Host ""
Write-Host "If login still fails, keep USB connected and run this script again."
