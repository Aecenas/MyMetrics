import { invoke } from '@tauri-apps/api/core';

const isTauri = () => typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

type TauriNotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

const mapPermissionState = (
  state: TauriNotificationPermissionState | null | undefined,
): NotificationPermission => {
  if (state === 'granted' || state === 'denied') return state;
  return 'default';
};

const getTauriPermissionStatus = async (): Promise<NotificationPermission> => {
  const granted = await invoke<boolean | null>('plugin:notification|is_permission_granted');
  if (granted === true) return 'granted';
  if (granted === false) return 'denied';
  return 'default';
};

export const notificationService = {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (!isTauri()) return 'unsupported';
    return getTauriPermissionStatus();
  },

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!isTauri()) return 'unsupported';
    const permission = await invoke<TauriNotificationPermissionState>('plugin:notification|request_permission');
    return mapPermissionState(permission);
  },

  async sendDesktopNotification(title: string, body: string): Promise<boolean> {
    try {
      if (!isTauri()) return false;
      const permission = await getTauriPermissionStatus();
      if (permission !== 'granted') return false;

      await invoke('plugin:notification|notify', {
        options: { title, body },
      });
      return true;
    } catch (error) {
      console.warn('Failed to send desktop notification', error);
      return false;
    }
  },
};
