import { useCallback, useEffect, useState } from 'react';
import { BluetoothService, type BtDeviceInfo } from '../services/BluetoothService';

export function useBluetoothPoll(intervalMs = 5000): {
  devices: BtDeviceInfo[];
  refresh: () => Promise<void>;
} {
  const [devices, setDevices] = useState<BtDeviceInfo[]>([]);
  const refresh = useCallback(async () => {
    const d = await BluetoothService.listDevices();
    setDevices(d);
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);
  return { devices, refresh };
}
