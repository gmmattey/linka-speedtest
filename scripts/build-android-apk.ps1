param(
  [ValidateSet("debug", "release")]
  [string]$BuildType = "debug",

  [int]$BuildNumber = 0
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$androidDir = Join-Path $root "android"
$toolchainDir = Join-Path $root "_android-toolchain"
$sdkDir = Join-Path $toolchainDir "android-sdk"
$javaDir = Join-Path $toolchainDir "java"
$gradleHome = Join-Path $toolchainDir "gradle-home"
$apkDir = Join-Path $root "builds\apk"
$packageJsonPath = Join-Path $root "package.json"
$appBuildGradlePath = Join-Path $androidDir "app\build.gradle"

if (-not (Test-Path $sdkDir)) { throw "Android SDK local nÃ£o encontrado em: $sdkDir" }
if (-not (Test-Path (Join-Path $javaDir "bin\java.exe"))) { throw "JDK 21 local nÃ£o encontrado em: $javaDir" }
if (-not (Test-Path $androidDir)) { throw "Projeto Android nÃ£o encontrado em: $androidDir" }

$packageJson = Get-Content -Raw $packageJsonPath | ConvertFrom-Json
$versionName = [string]$packageJson.version

if ($versionName -notmatch '^(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$') {
  throw "VersÃ£o invÃ¡lida em package.json: '$versionName'. Use SemVer, ex.: 1.2.3."
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

if ($BuildType -eq "release" -and $BuildNumber -le 0) {
  throw "Build release exige -BuildNumber maior que zero para versionCode monotÃ´nico de mercado."
}

if ($BuildNumber -lt 0 -or $BuildNumber -gt 99) {
  throw "BuildNumber deve ficar entre 0 e 99. O versionCode reserva 2 dÃ­gitos para o nÃºmero de build."
}

$versionCode = ($major * 1000000) + ($minor * 10000) + ($patch * 100) + $BuildNumber

$gradleContent = Get-Content -Raw $appBuildGradlePath
$gradleContent = $gradleContent -replace 'versionCode\s+\d+', "versionCode $versionCode"
$gradleContent = $gradleContent -replace 'versionName\s+"[^"]+"', "versionName `"$versionName`""
Set-Content -Path $appBuildGradlePath -Value $gradleContent -NoNewline

$env:ANDROID_SDK_ROOT = $sdkDir
$env:ANDROID_HOME = $sdkDir
$env:JAVA_HOME = $javaDir
$env:GRADLE_USER_HOME = $gradleHome
$env:Path = (Join-Path $javaDir "bin") + ";" + (Join-Path $sdkDir "platform-tools") + ";" + $env:Path

Push-Location $root
try {
  npm run build
  npx cap sync android
}
finally {
  Pop-Location
}

$gradleTask = if ($BuildType -eq "release") { "assembleRelease" } else { "assembleDebug" }
Push-Location $androidDir
try {
  .\gradlew.bat $gradleTask --no-daemon
}
finally {
  Pop-Location
}

$sourceApk = if ($BuildType -eq "release") {
  Join-Path $androidDir "app\build\outputs\apk\release\app-release-unsigned.apk"
} else {
  Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
}

if (-not (Test-Path $sourceApk)) {
  throw "APK esperado nÃ£o foi gerado: $sourceApk"
}

New-Item -ItemType Directory -Force -Path $apkDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$gitSha = "nogit"
try {
  $gitShaRaw = git -C $root rev-parse --short HEAD 2>$null
  if ($LASTEXITCODE -eq 0 -and $gitShaRaw) { $gitSha = $gitShaRaw.Trim() }
} catch {}

$targetName = "linkaSpeedtestPwa-v$versionName-code$versionCode-$BuildType-$timestamp-$gitSha.apk"
$targetApk = Join-Path $apkDir $targetName

if (Test-Path $targetApk) {
  throw "APK de destino jÃ¡ existe. Regra do projeto: nunca sobrescrever APK. Arquivo: $targetApk"
}

Copy-Item -LiteralPath $sourceApk -Destination $targetApk -ErrorAction Stop

$apksigner = Join-Path $sdkDir "build-tools\36.1.0\apksigner.bat"
if (Test-Path $apksigner) {
  & $apksigner verify --verbose $targetApk
}

Write-Host ""
Write-Host "APK gerado sem sobrescrever artefatos anteriores:"
Write-Host $targetApk
Write-Host "versionName=$versionName"
Write-Host "versionCode=$versionCode"

