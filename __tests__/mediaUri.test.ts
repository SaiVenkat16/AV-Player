import { toImageSource, toMediaUri } from '../src/utils/mediaUri';

describe('mediaUri', () => {
  test('normalizes raw local paths into file uris', () => {
    expect(toMediaUri('/storage/emulated/0/DCIM/demo.mp4')).toBe(
      'file:///storage/emulated/0/DCIM/demo.mp4',
    );
  });

  test('preserves existing file uris', () => {
    expect(toMediaUri('file:///storage/emulated/0/DCIM/demo.mp4')).toBe(
      'file:///storage/emulated/0/DCIM/demo.mp4',
    );
  });

  test('preserves content uris for native media access', () => {
    const contentUri = 'content://media/external/video/media/42';
    expect(toMediaUri(contentUri)).toBe(contentUri);
    expect(toImageSource(contentUri)).toEqual({ uri: contentUri });
  });
});
