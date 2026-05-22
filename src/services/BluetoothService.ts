import { Platform } from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import { requestBluetoothPermission } from './PermissionService';
import { Logger } from '../utils/logger';

export type BtDeviceInfo = {
  id: string;
  name: string;
  address: string;
  connected: boolean;
};

function mapDevice(d: BluetoothDevice, connected: boolean): BtDeviceInfo {
  return {
    id: d.address,
    name: d.name ?? d.address,
    address: d.address,
    connected,
  };
}

export const BluetoothService = {
  async listDevices(): Promise<BtDeviceInfo[]> {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return [];
    }
    const granted = await requestBluetoothPermission();
    if (!granted) {
      return [];
    }
    try {
      const [bonded, connected] = await Promise.all([
        RNBluetoothClassic.getBondedDevices(),
        RNBluetoothClassic.getConnectedDevices(),
      ]);
      const connAddr = new Set(connected.map(c => c.address));
      const rows: BtDeviceInfo[] = [];
      for (const c of connected) {
        rows.push(mapDevice(c, true));
      }
      for (const b of bonded) {
        if (!connAddr.has(b.address)) {
          rows.push(mapDevice(b, false));
        }
      }
      return rows;
    } catch (err) {
      Logger.warn('BluetoothService', 'Failed to list Bluetooth devices', err);
      return [];
    }
  },
  async connect(address: string): Promise<boolean> {
    const granted = await requestBluetoothPermission();
    if (!granted) {
      return false;
    }
    try {
      await RNBluetoothClassic.connectToDevice(address);
      Logger.info('BluetoothService', `Connected to device: ${address}`);
      return true;
    } catch (err) {
      Logger.warn(
        'BluetoothService',
        `Failed to connect to device: ${address}`,
        err,
      );
      return false;
    }
  },
  async disconnect(address: string): Promise<boolean> {
    const granted = await requestBluetoothPermission();
    if (!granted) {
      return false;
    }
    try {
      const result = await RNBluetoothClassic.disconnectFromDevice(address);
      Logger.info('BluetoothService', `Disconnected from device: ${address}`);
      return result;
    } catch (err) {
      Logger.warn(
        'BluetoothService',
        `Failed to disconnect from device: ${address}`,
        err,
      );
      return false;
    }
  },
};
