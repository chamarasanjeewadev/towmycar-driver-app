import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useDriverProfile } from './use-driver-api';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
} from '@/lib/notifications/push-notifications';

export function usePushNotifications() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useDriverProfile();
  const userId = profile?.id;
  const registeredRef = useRef(false);

  console.log('[PushNotifications] hook running — userId:', userId, 'isLoading:', isLoading, 'error:', !!error);

  // Register token when userId becomes available
  useEffect(() => {
    console.log('[PushNotifications] useEffect fired — userId:', userId, 'alreadyRegistered:', registeredRef.current);
    if (!userId || registeredRef.current) return;
    registeredRef.current = true;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        sendTokenToBackend(userId, token);
      } else {
        console.warn('[PushNotifications] No token returned from registerForPushNotificationsAsync');
      }
    });
  }, [userId]);

  // Listen for token refresh
  useEffect(() => {
    if (!userId) return;

    const tokenSub = Notifications.addPushTokenListener((tokenData) => {
      const token = tokenData.data as string;
      console.log('[Notifications] Token refreshed:', token.substring(0, 20) + '...');
      sendTokenToBackend(userId, token);
    });

    return () => tokenSub.remove();
  }, [userId]);

  // Listen for foreground notifications
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const title = notification.request.content.title ?? 'New notification';
      const data = notification.request.content.data;
      console.log('[Notifications] Foreground:', title, '| data:', JSON.stringify(data));
    });

    return () => receivedSub.remove();
  }, []);

  // Listen for notification taps
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Notifications] User tapped notification, data:', data);
      handleNotificationNavigation(data);
    });

    return () => responseSub.remove();
  }, []);

  // Handle cold-start: notification that launched the app
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        console.log('[Notifications] Cold-start notification data:', data);
        handleNotificationNavigation(data);
      }
    });
  }, []);

  function handleNotificationNavigation(data: Record<string, unknown>) {
    if (data?.requestId) {
      router.push(`/(app)/requests/${data.requestId}` as const);
    } else {
      router.push('/(app)/requests' as const);
    }
  }
}
