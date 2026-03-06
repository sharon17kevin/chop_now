import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { WalletService } from '@/services/wallet';
import { formatTimeAgo } from '@/utils/time';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Filter,
  Search,
  TrendingUp,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
  reference: string;
  balance_before: number;
  balance_after: number;
}

type FilterType = 'all' | 'credit' | 'debit';
type PeriodType = 'all' | 'today' | 'week' | 'month';

export default function TransactionHistoryScreen() {
  const { colors } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [period, setPeriod] = useState<PeriodType>('all');

  // Stats
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterType, period]);

  async function fetchTransactions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const txData = await WalletService.getTransactions(user.id, 100);
      setTransactions(txData as Transaction[]);

      // Calculate stats
      const credits = txData
        .filter((tx: any) => tx.type === 'credit')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
      const debits = txData
        .filter((tx: any) => tx.type === 'debit')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      setTotalCredit(credits);
      setTotalDebit(debits);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchTransactions();
  }

  function applyFilters() {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    // Filter by period
    if (period !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at);
        if (period === 'today') return txDate >= today;
        if (period === 'week') return txDate >= weekAgo;
        if (period === 'month') return txDate >= monthAgo;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(query) ||
          tx.reference?.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query),
      );
    }

    setFilteredTransactions(filtered);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }

  function groupTransactionsByDate() {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = formatDate(tx.created_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return Object.entries(groups).map(([date, txs]) => ({
      date,
      transactions: txs,
    }));
  }

  function getTransactionIcon(type: string) {
    return type === 'credit' ? (
      <ArrowDownCircle size={20} color={colors.success} />
    ) : (
      <ArrowUpCircle size={20} color={colors.error} />
    );
  }

  function renderTransaction({ item }: { item: Transaction }) {
    return (
      <View
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
                  item.type === 'credit'
                    ? colors.success + '20'
                    : colors.error + '20',
              },
            ]}
          >
            {getTransactionIcon(item.type)}
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionTitle, { color: colors.text }]}>
              {item.description ||
                (item.type === 'credit' ? 'Wallet Credit' : 'Payment')}
            </Text>
            <Text
              style={[styles.transactionDate, { color: colors.textSecondary }]}
            >
              {formatTimeAgo(item.created_at)}
            </Text>
            {item.reference && (
              <Text
                style={[styles.transactionRef, { color: colors.textTetiary }]}
              >
                Ref: {item.reference.substring(0, 20)}
                {item.reference.length > 20 ? '...' : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: item.type === 'credit' ? colors.success : colors.error,
              },
            ]}
          >
            {item.type === 'credit' ? '+' : '-'}₦{item.amount.toLocaleString()}
          </Text>
          <Text style={[styles.balanceAfter, { color: colors.textSecondary }]}>
            Bal: ₦{item.balance_after.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Transaction History" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const groupedData = groupTransactionsByDate();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Transaction History" />

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View
          style={[styles.statCard, { backgroundColor: colors.success + '20' }]}
        >
          <ArrowDownCircle size={20} color={colors.success} />
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.success }]}>
              Total In
            </Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              ₦{totalCredit.toLocaleString()}
            </Text>
          </View>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.error + '20' }]}
        >
          <ArrowUpCircle size={20} color={colors.error} />
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.error }]}>
              Total Out
            </Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              ₦{totalDebit.toLocaleString()}
            </Text>
          </View>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}
        >
          <TrendingUp size={20} color={colors.primary} />
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>
              Net
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              ₦{(totalCredit - totalDebit).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterChips}>
            {/* Type Filter */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filterType === 'all' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilterType('all')}
            >
              <Filter
                size={14}
                color={filterType === 'all' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'all' ? '#FFFFFF' : colors.text },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filterType === 'credit' ? colors.success : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilterType('credit')}
            >
              <ArrowDownCircle
                size={14}
                color={filterType === 'credit' ? '#FFFFFF' : colors.success}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'credit' ? '#FFFFFF' : colors.text },
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filterType === 'debit' ? colors.error : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilterType('debit')}
            >
              <ArrowUpCircle
                size={14}
                color={filterType === 'debit' ? '#FFFFFF' : colors.error}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'debit' ? '#FFFFFF' : colors.text },
                ]}
              >
                Debit
              </Text>
            </TouchableOpacity>

            {/* Period Filter */}
            <View style={styles.filterDivider} />

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    period === 'today' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setPeriod('today')}
            >
              <Calendar
                size={14}
                color={period === 'today' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: period === 'today' ? '#FFFFFF' : colors.text },
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    period === 'week' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setPeriod('week')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: period === 'week' ? '#FFFFFF' : colors.text },
                ]}
              >
                This Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    period === 'month' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setPeriod('month')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: period === 'month' ? '#FFFFFF' : colors.text },
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    period === 'all' ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setPeriod('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: period === 'all' ? '#FFFFFF' : colors.text },
                ]}
              >
                All Time
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.textSecondary} />
          <Text
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            {searchQuery || filterType !== 'all' || period !== 'all'
              ? 'No transactions found'
              : 'No transactions yet'}
          </Text>
          <Text
            style={[styles.emptyStateSubtext, { color: colors.textTetiary }]}
          >
            {searchQuery || filterType !== 'all' || period !== 'all'
              ? 'Try adjusting your filters'
              : 'Your transaction history will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.dateGroup}>
              <Text
                style={[styles.dateHeader, { color: colors.textSecondary }]}
              >
                {item.date}
              </Text>
              {item.transactions.map((tx) => (
                <View key={tx.id}>{renderTransaction({ item: tx })}</View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filtersContainer: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterDivider: {
    width: 1,
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    marginBottom: 2,
  },
  transactionRef: {
    fontSize: 10,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  balanceAfter: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
});
