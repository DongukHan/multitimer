import * as Notifications from 'expo-notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTimerNotification(
  id: string,
  label: string,
  secondsFromNow: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: `timer_${id}`,
    content: { title: '타이머 완료', body: `${label} 완료!`, sound: true },
    trigger: { seconds: secondsFromNow, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function scheduleAlarmNotification(
  id: string,
  label: string,
  hour: number,
  minute: number,
  repeats: boolean
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: `alarm_${id}`,
    content: { title: '알람', body: label || '알람이 울립니다', sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      second: 0,
      repeats,
    },
  });
}
