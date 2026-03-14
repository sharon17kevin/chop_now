import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { AdminService } from '@/services/admin';
import { ArrowLeft, Bell, Send, Users } from 'lucide-react-native';
import { router } from 'expo-router';

type TargetAudience = 'all' | 'customer' | 'vendor';
type NotificationType = 'promotion' | 'alert' | 'system';

const AUDIENCES: { label: string; value: TargetAudience; desc: string }[] = [
  { label: 'All Users', value: 'all', desc: 'Everyone on the platform' },
  { label: 'Customers', value: 'customer', desc: 'Buyers only' },
  { label: 'Vendors', value: 'vendor', desc: 'Sellers only' },
];

const TYPES: { label: string; value: NotificationType; color: string }[] = [
  { label: 'Promotion', value: 'promotion', color: '#8b5cf6' },
  { label: 'Alert', value: 'alert', color: '#f59e0b' },
  { label: 'System', value: 'system', color: '#3b82f6' },
];

export default function BroadcastNotifications() {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<TargetAudience>('all');
  const [type, setType] = useState<NotificationType>('promotion');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Validation', 'Message is required.');
      return;
    }

    Alert.alert(
      'Send Broadcast',
      `Send "${title}" to ${audience === 'all' ? 'all users' : audience + 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const targetRole = audience === 'all' ? null : audience;
              const result = await AdminService.broadcastNotification(
                title.trim(),
                message.trim(),
                type,
                targetRole,
              );

              Alert.alert(
                'Broadcast Sent',
                `In-app: ${result.notified} users\nPush: ${result.pushed} devices`,
              );

              // Reset form
              setTitle('');
              setMessage('');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to send broadcast.',
              );
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.filter,
            width: 40,
            height: 40,
            borderRadius: 20,
            padding: 8,
            elevation: 3,
            shadowColor: colors.text,
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>
          Banner Management
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Compose Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Send size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Compose Broadcast
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Title *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Message *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your notification message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Target Audience */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Users size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Target Audience
            </Text>
          </View>

          {AUDIENCES.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[
                styles.optionRow,
                {
                  backgroundColor:
                    audience === a.value
                      ? colors.secondary + '15'
                      : 'transparent',
                  borderColor:
                    audience === a.value ? colors.secondary : colors.border,
                },
              ]}
              onPress={() => setAudience(a.value)}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor:
                      audience === a.value ? colors.secondary : colors.border,
                  },
                ]}
              >
                {audience === a.value && (
                  <View
                    style={[
                      styles.radioFill,
                      { backgroundColor: colors.secondary },
                    ]}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {a.label}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {a.desc}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Type */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Bell size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Notification Type
            </Text>
          </View>

          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === t.value ? t.color : colors.input,
                    borderColor:
                      type === t.value ? t.color : colors.inputBorder,
                  },
                ]}
                onPress={() => setType(t.value)}
              >
                <Text
                  style={{
                    color: type === t.value ? '#fff' : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        {(title.trim() || message.trim()) && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: colors.textSecondary, marginBottom: 12 },
              ]}
            >
              Preview
            </Text>
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.previewDot,
                  {
                    backgroundColor:
                      TYPES.find((t) => t.value === type)?.color ||
                      colors.secondary,
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {title || 'Notification Title'}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  {message || 'Notification message will appear here...'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: colors.secondary },
            sending && { opacity: 0.6 },
          ]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Send size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Send Broadcast</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
  },
  sendBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
