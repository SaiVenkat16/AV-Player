import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/services/StorageScanner', () => ({
  requestStoragePermission: jest.fn().mockResolvedValue(false),
}));

test('App mounts without throwing', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
