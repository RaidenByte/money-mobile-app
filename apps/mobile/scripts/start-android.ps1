param(
  [string]$AvdName = "",
  [switch]$UseExpoGo,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[android-runner] $Message"
}

function Resolve-SdkPath {
  if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    return $env:ANDROID_SDK_ROOT
  }
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    return $env:ANDROID_HOME
  }
  $default = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $default) {
    return $default
  }
  throw "Android SDK not found. Install Android Studio and verify SDK path."
}

function Add-AndroidToolsToPath {
  param([string]$SdkPath)
  $tools = @(
    (Join-Path $SdkPath "platform-tools"),
    (Join-Path $SdkPath "emulator"),
    (Join-Path $SdkPath "cmdline-tools\latest\bin")
  )
  foreach ($tool in $tools) {
    if (Test-Path $tool) {
      if (-not ($env:Path -split ";" | Where-Object { $_ -eq $tool })) {
        $env:Path = "$tool;$env:Path"
      }
    }
  }
}

function Get-ConnectedDeviceSerial {
  $devices = adb devices | Select-String "device$" | ForEach-Object { $_.Line.Trim() }
  foreach ($line in $devices) {
    if ($line -and -not $line.StartsWith("List of devices")) {
      return ($line -split "\s+")[0]
    }
  }
  return $null
}

function Ensure-EmulatorWindowVisible {
  param([string]$TargetAvd)

  if (-not ("Win32WindowTools" -as [type])) {
    Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Win32WindowTools {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

  [DllImport("user32.dll")]
  public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@
  }

  $candidates = Get-Process |
    Where-Object { $_.ProcessName -eq 'qemu-system-x86_64' -and $_.MainWindowHandle -ne 0 }

  if ($TargetAvd) {
    $candidates = $candidates | Where-Object { $_.MainWindowTitle -like "*$TargetAvd*" }
  }

  $windowProc = $candidates | Sort-Object StartTime -Descending | Select-Object -First 1
  if (-not $windowProc) {
    Write-Step "Emulator window not found yet, skip window fix."
    return
  }

  $rect = New-Object Win32WindowTools+RECT
  [Win32WindowTools]::GetWindowRect($windowProc.MainWindowHandle, [ref]$rect) | Out-Null
  $width = [Math]::Max(($rect.Right - $rect.Left), 430)
  $height = [Math]::Max(($rect.Bottom - $rect.Top), 900)

  # If window is outside common visible area, move back to primary screen.
  $needsMove = $rect.Top -lt -200 -or $rect.Left -lt -2000 -or $rect.Left -gt 5000 -or $rect.Top -gt 3000
  if ($needsMove) {
    [Win32WindowTools]::MoveWindow($windowProc.MainWindowHandle, 120, 60, $width, $height, $true) | Out-Null
  }

  [Win32WindowTools]::ShowWindowAsync($windowProc.MainWindowHandle, 9) | Out-Null
  Start-Sleep -Milliseconds 200
  [Win32WindowTools]::SetForegroundWindow($windowProc.MainWindowHandle) | Out-Null
  Write-Step "Emulator window focused (handle: $($windowProc.MainWindowHandle))."
}

function Ensure-EmulatorStarted {
  param([string]$Name)

  $serial = Get-ConnectedDeviceSerial
  if ($serial) {
    Write-Step "Found connected device: $serial"
    Ensure-EmulatorWindowVisible -TargetAvd $Name
    return $serial
  }

  $avds = emulator -list-avds
  if (-not $avds) {
    throw "No AVD found. Create one in Android Studio Device Manager first."
  }

  $target = $Name
  if (-not $target) {
    $target = ($avds | Select-Object -First 1).Trim()
    Write-Step "No AVD provided. Using default: $target"
  } elseif (-not ($avds -contains $target)) {
    throw "AVD '$target' not found. Available AVDs: $($avds -join ', ')"
  }

  Write-Step "Starting emulator: $target (software GPU, no snapshot)"
  Start-Process -FilePath "emulator" -ArgumentList @(
    "-avd", $target,
    "-gpu", "swiftshader_indirect",
    "-no-snapshot-load"
  ) | Out-Null

  Write-Step "Waiting for emulator connection..."
  adb wait-for-device | Out-Null
  $serial = Get-ConnectedDeviceSerial
  if (-not $serial) {
    throw "Emulator did not connect."
  }

  Write-Step "Waiting for Android boot completion..."
  $booted = $false
  for ($i = 0; $i -lt 120; $i++) {
    try {
      $state = (adb -s $serial shell getprop sys.boot_completed 2>$null).Trim()
      if ($state -eq "1") {
        $booted = $true
        break
      }
    } catch {
      # Ignore transient adb errors while booting.
    }
    Start-Sleep -Seconds 2
  }

  if (-not $booted) {
    Write-Step "Boot check timed out. Continue anyway."
  } else {
    Write-Step "Emulator is ready."
  }

  Ensure-EmulatorWindowVisible -TargetAvd $target
  return $serial
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Step "Project root: $projectRoot"

$sdkPath = Resolve-SdkPath
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
Add-AndroidToolsToPath -SdkPath $sdkPath
Write-Step "Android SDK: $sdkPath"

if (-not $SkipInstall) {
  Write-Step "Installing dependencies (npm install)..."
  npm install
}

$serial = Ensure-EmulatorStarted -Name $AvdName
Write-Step "Current device: $serial"

if ($UseExpoGo) {
  Write-Step "Running Expo Go flow: npx expo start --android"
  npx expo start --android
} else {
  Write-Step "Running native flow: npx expo run:android"
  npx expo run:android
}
