/**
 * React Native New Architecture + CMake on Windows: very long or spaced paths
 * (e.g. ...\Desktop\...\React Native\...) often hit CMAKE_OBJECT_PATH_MAX / Ninja
 * "build.ninja still dirty". SUBST/junction usually still resolve to the long real path.
 * Fail fast with a clear fix: work from a short path without spaces.
 */
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

const root = path.resolve(__dirname, '..');
const hasSpaces = /\s/.test(root);
// Heuristic: base path length drives .cxx + encoded object names under node_modules.
const tooLong = root.length > 85;

if (!hasSpaces && !tooLong) {
  process.exit(0);
}

const reasons = [];
if (hasSpaces) {
  reasons.push('contains spaces');
}
if (tooLong) {
  reasons.push('is very long');
}
const reasonText = reasons.length ? reasons.join(' and ') : 'may hit native build limits';

const msg = `
Android native build (CMake/Ninja) on Windows is unreliable from this folder:

  ${root}

Reason: path ${reasonText}.
CMake warns about CMAKE_OBJECT_PATH_MAX (250); Reanimated often fails with
"ninja: manifest build.ninja still dirty after 100 tries".

Telugu (సంక్షిప్తం): Android native build కోసం ప్రాజెక్ట్‌ను స్పేస్ లేని చిన్న path లో ఉంచండి (ఉదా. C:\\dev\\AVP).

Permanent fix (pick one):
  1) Clone or copy the project to a short path with NO spaces, then build from there, e.g.
       C:\\dev\\AVP
       mkdir C:\\dev\\AVP 2>nul
       git clone <your-remote> C:\\dev\\AVP
       cd C:\\dev\\AVP && npm install && npm run android

  2) Rename parent folders to remove spaces (e.g. "ReactNative" instead of "React Native").

Optional: enable Windows long paths (helps some tools, not a full substitute):
  Run PowerShell as Administrator:
  New-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
  (Reboot may be required.)

Skip this check (not recommended):
  set SKIP_ANDROID_PATH_CHECK=1
`;

if (process.env.SKIP_ANDROID_PATH_CHECK === '1') {
  process.stderr.write('[check-android-path] skipped (SKIP_ANDROID_PATH_CHECK=1)\n');
  process.exit(0);
}

process.stderr.write(msg);
process.exit(1);
