/* Removes CMake output dirs that often get stuck on Windows (ninja "build.ninja still dirty"). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dirs = [
  path.join(root, 'android', 'app', '.cxx'),
  path.join(root, 'android', '.cxx'),
  path.join(root, 'node_modules', 'react-native-reanimated', 'android', '.cxx'),
  path.join(root, 'node_modules', 'react-native-worklets', 'android', '.cxx'),
  // Do not delete node_modules/*/android/build here — New-Arch CMake autolinking expects codegen/jni
  // dirs (e.g. @react-native-community/blur). Removing them causes :app:configureCMake* to fail.
];

for (const d of dirs) {
  try {
    fs.rmSync(d, { recursive: true, force: true });
    process.stdout.write(`removed ${d}\n`);
  } catch (e) {
    process.stderr.write(`skip ${d}: ${e.message}\n`);
  }
}
