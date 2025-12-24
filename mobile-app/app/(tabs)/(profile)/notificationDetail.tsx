import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Package, Tag, AlertCircle, Bell } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import AppHeader from '@/components/AppHeader';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchNotification();
    }
  }, [id]);

  async function fetchNotification() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setNotification(data);

      // Mark as read if unread
      if (data && !data.is_read) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Error fetching notification:', err);
    } finally {
      setLoading(false);
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={48} color="#059669" />;
      case 'promotion':
        return <Tag size={48} color="#F59E0B" />;
      case 'alert':
        return <AlertCircle size={48} color="#EF4444" />;
      default:
        return <Bell size={48} color="#6B7280" />;
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader
          title="Notification"
          onBack={() => router.push('/(tabs)/(profile)/notifications')}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader
          title="Notification"
          onBack={() => router.push('/(tabs)/(profile)/notifications')}
        />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Notification not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title="Notification"
        onBack={() => router.push('/(tabs)/(profile)/notifications')}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: colors.filter }]}
        >
          {getNotificationIcon(notification.type)}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {notification.title}
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatFullDate(notification.created_at)}
        </Text>

        {/* Message */}
        <View
          style={[styles.messageContainer, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.message, { color: colors.text }]}>
            {notification.message}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  messageContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
  },
});
