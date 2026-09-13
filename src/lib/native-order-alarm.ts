import { Capacitor, registerPlugin } from "@capacitor/core";

type EnableResult = { token: string; deviceName: string };

interface OrderAlarmPlugin {
  enable(): Promise<EnableResult>;
  stopAlarm(options: { alertId: string }): Promise<void>;
}

const OrderAlarm = registerPlugin<OrderAlarmPlugin>("OrderAlarm");

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function enableNativeOrderAlerts(): Promise<EnableResult> {
  return OrderAlarm.enable();
}

export async function stopNativeOrderAlarm(alertId: string): Promise<void> {
  if (!isNativeAndroid()) return;
  await OrderAlarm.stopAlarm({ alertId });
}