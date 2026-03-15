import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/api/client';
import messaging from '@react-native-firebase/messaging';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[Notifications] Starting registration...');
  console.log('[Notifications] isDevice:', Device.isDevice);
  console.log('[Notifications] Platform:', Platform.OS);

  if (!Device.isDevice) {
    console.warn('[Notifications] Not a physical device — skipping');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TowMyCar Driver',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0B1D33',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        showBadge: true,
      });
      console.log('[Notifications] Android channel created');
    } catch (e) {
      console.error('[Notifications] Failed to create channel:', e);
    }
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[Notifications] Existing permission status:', existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Notifications] Permission after request:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission DENIED — cannot get token');
    return null;
  }

  // Get FCM token
  try {
    let token: string;
    if (Platform.OS === 'ios') {
      // Firebase handles APNs ↔ FCM bridging on iOS
      await messaging().requestPermission();
      await messaging().registerDeviceForRemoteMessages();
      token = await messaging().getToken();
    } else {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData.data as string;
    }
    console.log('[Notifications] FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (e) {
    console.error('[Notifications] Failed to get FCM token:', e);
    return null;
  }
}

export async function sendTokenToBackend(userId: number, token: string): Promise<void> {
  const browserInfo = Platform.OS === 'ios' ? 'mobile-ios' : 'mobile-android';
  console.log('[Notifications] Sending token to backend for userId:', userId);
  try {
    const response = await apiClient.post('/user/fcm-token', {
      userId,
      token,
      browserInfo,
    });
    console.log('[Notifications] Token registered with backend, response:', response.status);
  } catch (error) {
    console.error('[Notifications] Failed to register token with backend:', error);
  }
}
