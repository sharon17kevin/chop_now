import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
} from '@/lib/pushNotifications';
import { useUserStore } from '@/stores/useUserStore';

/**
 * Hook to manage push notifications for the app
 */
export function usePushNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  useEffect(() => {
    // Register for push notifications when user is logged in
    if (profile?.id) {
      registerForPushNotifications().then(async (token) => {
        if (token) {
          setPushToken(token);
          await savePushToken(profile.id, token);
        }
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // When notification is received while app is open
      (notification) => {
        setNotification(notification);
        console.log('Notification received:', notification);
      },
      // When user taps on notification
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);

        // Navigate based on notification type
        if (data.type === 'new_order' && data.screen) {
          router.push(data.screen as any);
        } else if (data.type === 'order_update' && data.order_id) {
          router.push(`/(tabs)/(sell)/order-detail?orderId=${data.order_id}` as any);
        }
      }
    );

    return cleanup;
  }, [router]);

  return {
    pushToken,
    notification,
  };
}