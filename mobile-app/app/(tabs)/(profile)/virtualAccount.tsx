import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useVirtualAccountStore } from '@/stores/useVirtualAccountStore';
import {
  Wallet,
  Copy,
  CheckCircle,
  Info,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { createDedicatedAccount } from '@/lib/paystack';
import * as Clipboard from 'expo-clipboard';

export default function VirtualAccountScreen() {
  const {
    account: virtualAccount,
    isLoading: loading,
    error,
    fetchAccount,
    setAccount,
  } = useVirtualAccountStore();
  const [creating, setCreating] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    fetchVirtualAccountFromAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchVirtualAccountFromAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await fetchAccount(user.id);
    }
  }

  async function handleCreateAccount() {
    try {
      setCreating(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        throw new Error('Please sign in to create virtual account');
      }

      const result = await createDedicatedAccount(user.id, user.email);

      if (result.data) {
        // Update the store directly
        setAccount(result.data);

        Alert.alert(
          'Success!',
          'Your dedicated virtual account has been created. You can now receive payments to this account.'
        );
      } else {
        throw new Error('Failed to create virtual account');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create virtual account'
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Virtual Account" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Virtual Account" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <Info size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!virtualAccount ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <Wallet size={64} color="#059669" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Your Virtual Account
            </Text>
            <Text style={styles.description}>
              Get a dedicated account number that you can use to receive
              payments directly into your wallet. This account is permanent and
              unique to you.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.benefitText}>
                  Instant credit to your wallet
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.benefitText}>No transaction fees</Text>
              </View>
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.benefitText}>Available 24/7</Text>
              </View>
              <View style={styles.benefitItem}>
                <CheckCircle size={20} color="#059669" />
                <Text style={styles.benefitText}>Permanent account number</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAccount}
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Wallet size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>
                    Create Virtual Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountContainer}>
            <View style={styles.accountHeader}>
              <Building2 size={32} color="#059669" />
              <Text style={[styles.accountTitle, { color: colors.text }]}>
                Your Virtual Account
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Info size={16} color="#3B82F6" />
              <Text style={styles.infoText}>
                Transfer money to this account and it will be credited to your
                wallet instantly
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>
                    {virtualAccount.bank_name}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>
                    {virtualAccount.account_number}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(
                        virtualAccount.account_number,
                        'Account number'
                      )
                    }
                    style={styles.copyButton}
                  >
                    <Copy size={16} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Name</Text>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>
                    {virtualAccount.account_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(
                        virtualAccount.account_name,
                        'Account name'
                      )
                    }
                    style={styles.copyButton}
                  >
                    <Copy size={16} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>Important Notes:</Text>
              <Text style={styles.noteText}>
                • This account is unique to you and can be used multiple times
              </Text>
              <Text style={styles.noteText}>
                • Funds are credited instantly upon transfer
              </Text>
              <Text style={styles.noteText}>
                • Only send money from accounts in your name
              </Text>
              <Text style={styles.noteText}>
                • Keep this account number safe and don't share publicly
              </Text>
            </View>

            <TouchableOpacity
              style={styles.copyAllButton}
              onPress={() => {
                const details = `${virtualAccount.bank_name}\n${virtualAccount.account_number}\n${virtualAccount.account_name}`;
                copyToClipboard(details, 'Account details');
              }}
              activeOpacity={0.8}
            >
              <Copy size={20} color="#059669" />
              <Text style={styles.copyAllButtonText}>
                Copy All Account Details
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  scrollContainer: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 250,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accountContainer: {
    flex: 1,
  },
  accountHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    paddingVertical: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  noteContainer: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 6,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  copyAllButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
  },
});
