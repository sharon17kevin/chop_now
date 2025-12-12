import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useVirtualAccountStore } from '@/stores/useVirtualAccountStore';
import { formatTimeAgo } from '@/utils/time';
import { useRouter } from 'expo-router';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Plus,
    TrendingUp,
    Wallet
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  created_at: string;
  reference: string;
}

export default function WalletScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { account: virtualAccount, fetchAccount } = useVirtualAccountStore();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWalletData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch virtual account if not already loaded
      if (!virtualAccount) {
        await fetchAccount(user.id);
      }

      // Fetch wallet balance from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (profile) {
        setBalance(profile.wallet_balance || 0);
      }

      // Fetch recent transactions
      const { data: txData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txData) {
        setTransactions(txData as Transaction[]);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchWalletData();
  }

  function getTransactionIcon(type: string) {
    return type === 'credit' ? (
      <ArrowDownCircle size={20} color={colors.success} />
    ) : (
      <ArrowUpCircle size={20} color={colors.error} />
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Wallet" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Wallet" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={32} color="#FFFFFF" />
            <Text style={styles.balanceLabel}>Total Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>

          {virtualAccount && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>
                {virtualAccount.bank_name} • {virtualAccount.account_number}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push('/(tabs)/(profile)/virtualAccount' as any)
                }
                style={styles.viewAccountButton}
              >
                <Text style={styles.viewAccountText}>View Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push('/(tabs)/(profile)/virtualAccount' as any)
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.success + '20' },
              ]}
            >
              <Plus size={24} color={colors.success} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Fund Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => {
              // Navigate to withdrawal/transfer page
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <ArrowUpCircle size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Withdraw
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => {
              // Navigate to transaction history
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.secondary + '20' },
              ]}
            >
              <TrendingUp size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={48} color={colors.textSecondary} />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No transactions yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: colors.textTetiary },
                ]}
              >
                Fund your wallet to get started
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIconContainer,
                      {
                        backgroundColor:
                          transaction.type === 'credit'
                            ? colors.success + '20'
                            : colors.error + '20',
                      },
                    ]}
                  >
                    {getTransactionIcon(transaction.type)}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text
                      style={[styles.transactionTitle, { color: colors.text }]}
                    >
                      {transaction.description ||
                        (transaction.type === 'credit'
                          ? 'Wallet Credit'
                          : 'Payment')}
                    </Text>
                    <Text
                      style={[
                        styles.transactionDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatTimeAgo(transaction.created_at)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === 'credit'
                            ? colors.success
                            : colors.error,
                      },
                    ]}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₦
                    {transaction.amount.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.transactionStatus,
                      {
                        color:
                          transaction.status === 'success'
                            ? colors.success
                            : transaction.status === 'pending'
                            ? colors.warning
                            : colors.error,
                      },
                    ]}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  accountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    flex: 1,
  },
  viewAccountButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  viewAccountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
