# Builds from a short virtual drive (SUBST) so CMake/Ninja paths stay under Windows limits.
# Fixes "CMAKE_OBJECT_PATH_MAX" / "build.ninja still dirty" when the repo lives under a long path (e.g. ...\React Native\...).
#
# Do NOT start Metro from the SUBST drive: when this script's `finally` removes the mapping,
# Metro would still resolve the entry as R:\index and Metro returns "Unable to resolve module ./index".
# Use a separate terminal: `npm start` from the real project folder, then this script with --no-packager.
param(
  [int]$MetroPort = 8081
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$driveLetter = @('R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z') | Where-Object { -not (Test-Path "$_`:\") } | Select-Object -First 1
if (-not $driveLetter) {
  throw 'No free drive letter R–Z for SUBST. Run: subst to list mappings, then subst X: /d to remove one.'
}

Write-Host @"

SUBST build: native CMake/Gradle will use ${driveLetter}:\ (short paths).
Metro: start separately from the REAL folder (not SUBST), same port $MetroPort :
  cd `"$projectRoot`"
  npm start

Then this script connects the app to that packager (--no-packager).

"@
Write-Host "SUBST ${driveLetter}: -> $projectRoot"
cmd /c "subst ${driveLetter}: `"$projectRoot`""
if ($LASTEXITCODE -ne 0) {
  throw "subst failed (exit $LASTEXITCODE)"
}

Push-Location "${driveLetter}:\"
try {
  npx react-native run-android --port $MetroPort --no-packager
} finally {
  Pop-Location
  cmd /c "subst ${driveLetter}: /d"
  Write-Host "Removed SUBST ${driveLetter}:"
}
