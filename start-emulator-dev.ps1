param(
  [string]$AvdName = "Pixel_2_XL",
  [switch]$NoApi,
  [switch]$NoMetro,
  [switch]$NoLaunchApp
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

function Resolve-AdbPath() {
  $candidates = @(@(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe",
    "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) })

  if ($candidates.Count -gt 0) { return $candidates[0] }
  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Resolve-EmulatorPath() {
  $candidates = @(@(
    "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe",
    "$env:ANDROID_HOME\emulator\emulator.exe",
    "$env:ANDROID_SDK_ROOT\emulator\emulator.exe"
  ) | Where-Object { $_ -and (Test-Path $_) })

  if ($candidates.Count -gt 0) { return $candidates[0] }
  return $null
}

function Wait-Until($timeoutSeconds, [ScriptBlock]$predicate) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $timeoutSeconds) {
    if (& $predicate) { return $true }
    Start-Sleep -Milliseconds 900
  }
  return $false
}

function Get-ConnectedEmulatorSerial($adbPath) {
  $lines = & $adbPath devices
  $line = $lines | Where-Object { $_ -match "^emulator-\d+\s+device$" } | Select-Object -First 1
  if ($line) { return ($line -split "\s+")[0] }
  return $null
}

function Wait-ConnectedEmulatorSerial($adbPath, $timeoutSeconds, $preferredSerial) {
  $script:__emuSerial = $null
  $ok = Wait-Until $timeoutSeconds {
    $lines = & $adbPath devices
    if ($preferredSerial) {
      $exact = $lines | Where-Object { $_ -match ("^" + [regex]::Escape($preferredSerial) + "\s+device$") } | Select-Object -First 1
      if ($exact) {
        $script:__emuSerial = $preferredSerial
        return $true
      }
    }
    $any = $lines | Where-Object { $_ -match "^emulator-\d+\s+device$" } | Select-Object -First 1
    if ($any) {
      $script:__emuSerial = ($any -split "\s+")[0]
      return $true
    }
    return $false
  }
  if ($ok) { return $script:__emuSerial }
  return $null
}

function Ensure-ApiRunning($apiDir) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/health" -TimeoutSec 2
    if ($resp.StatusCode -eq 200) {
      Write-Ok "API already running (3000)"
      return
    }
  } catch {}

  Write-Step "Starting API server"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev > api-dev.log 2>&1" -WorkingDirectory $apiDir | Out-Null
  $ok = Wait-Until 45 { 
    try {
      $r = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/health" -TimeoutSec 2
      $r.StatusCode -eq 200
    } catch { $false }
  }

  if ($ok) {
    Write-Ok "API healthy: http://localhost:3000/health"
  } else {
    Write-WarnMsg "API health check timeout. Check: $apiDir\api-dev.log"
  }
}

function Restart-MetroForEmulator($mobileDir) {
  Write-Step "Restarting Metro (emulator mode)"
  try {
    $listens = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $listens) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  } catch {}

  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 && npx expo start --dev-client --port 8081 > metro.log 2>&1" -WorkingDirectory $mobileDir | Out-Null
  $ok = Wait-Until 80 {
    try {
      $r = Invoke-WebRequest -UseBasicParsing "http://localhost:8081/status" -TimeoutSec 2
      $r.StatusCode -eq 200
    } catch { $false }
  }

  if ($ok) {
    Write-Ok "Metro is listening on 8081"
  } else {
    Write-WarnMsg "Metro start timeout. Check: $mobileDir\metro.log"
  }
}

function Center-EmulatorWindow() {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public struct RECT {
  public int Left;
  public int Top;
  public int Right;
  public int Bottom;
}
public static class Win32Native {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int cmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@

  function Find-EmulatorWindowHandle {
    $script:__emuHwnd = [IntPtr]::Zero
    $cb = [Win32Native+EnumWindowsProc]{
      param([IntPtr]$hWnd, [IntPtr]$lParam)
      if (-not [Win32Native]::IsWindowVisible($hWnd)) { return $true }
      $len = [Win32Native]::GetWindowTextLength($hWnd)
      if ($len -le 0) { return $true }

      $sb = New-Object System.Text.StringBuilder ($len + 1)
      [void][Win32Native]::GetWindowText($hWnd, $sb, $sb.Capacity)
      $title = $sb.ToString()
      if ($title -like "Android Emulator*" -or $title -like "*Pixel_2_XL*" -or $title -like "*5554*") {
        $script:__emuHwnd = $hWnd
        return $false
      }
      return $true
    }
    [Win32Native]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
    return $script:__emuHwnd
  }

  $windowReady = Wait-Until 40 {
    $h = Find-EmulatorWindowHandle
    $h -ne [IntPtr]::Zero
  }

  if (-not $windowReady) {
    Write-WarnMsg "Cannot find emulator window handle."
    return
  }

  $hWnd = Find-EmulatorWindowHandle
  if ($hWnd -eq [IntPtr]::Zero) {
    Write-WarnMsg "Cannot find emulator window handle."
    return
  }
  $workArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  [Win32Native]::ShowWindowAsync($hWnd, 9) | Out-Null
  Start-Sleep -Milliseconds 200

  $rect = New-Object RECT
  [Win32Native]::GetWindowRect($hWnd, [ref]$rect) | Out-Null

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -le 0 -or $height -le 0) {
    # Fallback size when some GPU/desktop states report 0x0 window first.
    $width = [Math]::Min(500, $workArea.Width - 40)
    $height = [Math]::Min(980, $workArea.Height - 40)
  }

  $newX = [int]($workArea.Left + (($workArea.Width - $width) / 2))
  $newY = [int]($workArea.Top + (($workArea.Height - $height) / 2))
  if ($newX -lt $workArea.Left) { $newX = $workArea.Left }
  if ($newY -lt $workArea.Top) { $newY = $workArea.Top }

  [Win32Native]::MoveWindow($hWnd, $newX, $newY, $width, $height, $true) | Out-Null
  [Win32Native]::SetForegroundWindow($hWnd) | Out-Null
  Write-Ok "Emulator window centered"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root "apps\api"
$mobileDir = Join-Path $root "apps\mobile"
$apkPath = Join-Path $mobileDir "android\app\build\outputs\apk\debug\app-debug.apk"

$adb = Resolve-AdbPath
$emulator = Resolve-EmulatorPath
if (-not $adb) { throw "adb.exe not found. Please install Android SDK Platform-Tools." }
if (-not $emulator) { throw "emulator.exe not found. Please install Android Emulator." }

Write-Step "Checking emulator device"
$serial = Get-ConnectedEmulatorSerial $adb
if ($serial) {
  Write-Ok "Emulator already connected: $serial"
} else {
  Write-Step "Starting emulator AVD: $AvdName"
  Start-Process -FilePath $emulator -ArgumentList "-avd", $AvdName | Out-Null
  $serial = Wait-ConnectedEmulatorSerial $adb 90 $null
  if (-not $serial) { throw "Emulator not connected in time." }
  Write-Ok "Emulator connected: $serial"
}

Write-Step "Waiting emulator boot complete"
$bootOk = Wait-Until 120 {
  $boot = (& $adb -s $serial shell getprop sys.boot_completed 2>$null).Trim()
  $boot -eq "1"
}
if (-not $bootOk) {
  Write-WarnMsg "Emulator boot check timeout, continue anyway."
} else {
  Write-Ok "Emulator boot completed"
}

Center-EmulatorWindow

if (-not $NoApi) {
  Ensure-ApiRunning $apiDir
}

if (-not $NoMetro) {
  Restart-MetroForEmulator $mobileDir
}

if (-not $NoLaunchApp) {
  $serial = Wait-ConnectedEmulatorSerial $adb 30 $serial
  if (-not $serial) { throw "Emulator disconnected before app launch." }
  Write-Step "Opening app on emulator"
  $pkgLine = (& $adb -s $serial shell pm list packages com.anonymous.mobile 2>$null)
  if ($pkgLine) { $pkgLine = $pkgLine.Trim() } else { $pkgLine = "" }
  if (-not $pkgLine -and (Test-Path $apkPath)) {
    Write-Step "App not found, installing debug APK"
    & $adb -s $serial install -r $apkPath | Out-Null
  }
  & $adb -s $serial shell monkey -p com.anonymous.mobile -c android.intent.category.LAUNCHER 1 | Out-Null
  Write-Ok "App launch sent"
}

Write-Host ""
Write-Host "Done."
Write-Host "AVD: $AvdName"
Write-Host "Serial: $serial"
Write-Host "API log:   $apiDir\api-dev.log"
Write-Host "Metro log: $mobileDir\metro.log"
