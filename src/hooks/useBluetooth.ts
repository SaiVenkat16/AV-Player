import { useCallback, useEffect, useState } from 'react';
import { BluetoothService, type BtDeviceInfo } from '../services/BluetoothService';

export function useBluetoothPoll(active: boolean, intervalMs = 5000): {
  devices: BtDeviceInfo[];
  refresh: () => Promise<void>;
} {
  const [devices, setDevices] = useState<BtDeviceInfo[]>([]);
  const refresh = useCallback(async () => {
    if (!active) return;
    const d = await BluetoothService.listDevices();
    setDevices(d);
  }, [active]);
  useEffect(() => {
    if (!active) {
      setDevices([]);
      return;
    }
    refresh();
    const t = setInterval(() => {
      refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [refresh, active, intervalMs]);
  return { devices, refresh };
}
