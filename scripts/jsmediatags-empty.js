// Stub for jsmediatags readers that don't work in React Native
// (BlobFileReader, XhrFileReader, NodeFileReader).
// We pass an ArrayBuffer in MetadataService, so ArrayFileReader is used.
// jsmediatags calls `.canReadFile(file)` on every registered reader,
// so the stub must return false (never claims to handle the input).
function NoopReader() {}
NoopReader.canReadFile = function () {
  return false;
};
NoopReader.setConfig = function () {};
module.exports = NoopReader;
module.exports.default = NoopReader;
