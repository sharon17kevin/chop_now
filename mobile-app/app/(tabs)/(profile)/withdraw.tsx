import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowUpCircle,
  Building2,
  CheckCircle,
  ChevronDown,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService } from '@/services/profiles';
import { WalletService } from '@/services/wallet';
import AppHeader from '@/components/AppHeader';
import { useRouter } from 'expo-router';

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank', code: '00103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

const MIN_WITHDRAWAL = 5000;

export default function WithdrawScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Bank account state
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [savedBank, setSavedBank] = useState<{
    bank_account_number: string;
    bank_code: string;
    bank_name: string;
    account_name: string;
  } | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-resolve account when account number is 10 digits and bank is selected
    if (accountNumber.length === 10 && selectedBank) {
      resolveAccount();
    } else {
      setAccountName('');
    }
  }, [accountNumber, selectedBank]);

  async function loadData() {
    try {
      if (!user?.id) return;

      const [balance, bankData] = await Promise.all([
        ProfileService.getWalletBalance(user.id),
        ProfileService.getBankAccount(user.id),
      ]);

      setWalletBalance(balance);

      if (bankData?.bank_account_number && bankData?.bank_code) {
        setHasSavedBank(true);
        setSavedBank({
          bank_account_number: bankData.bank_account_number,
          bank_code: bankData.bank_code,
          bank_name: bankData.bank_name || '',
          account_name: bankData.account_name || '',
        });
      }
    } catch (err) {
      console.error('Failed to load withdrawal data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAccount() {
    if (!selectedBank || accountNumber.length !== 10) return;

    try {
      setResolving(true);
      const result = await WalletService.resolveAccount(
        accountNumber,
        selectedBank.code,
      );
      setAccountName(result.account_name);
    } catch (err) {
      setAccountName('');
      Alert.alert(
        'Error',
        'Could not verify account. Please check the details.',
      );
    } finally {
      setResolving(false);
    }
  }

  function getActiveBank() {
    if (hasSavedBank && !showBankForm && savedBank) {
      return savedBank;
    }
    if (selectedBank && accountName) {
      return {
        bank_account_number: accountNumber,
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
        account_name: accountName,
      };
    }
    return null;
  }

  const parsedAmount = parseFloat(amount) || 0;
  const activeBank = getActiveBank();
  const canWithdraw =
    parsedAmount >= MIN_WITHDRAWAL &&
    parsedAmount <= walletBalance &&
    activeBank !== null &&
    !processing;

  async function handleWithdraw() {
    if (!user?.id || !activeBank) return;

    if (parsedAmount < MIN_WITHDRAWAL) {
      Alert.alert(
        'Minimum Amount',
        `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`,
      );
      return;
    }

    if (parsedAmount > walletBalance) {
      Alert.alert(
        'Insufficient Balance',
        'You cannot withdraw more than your wallet balance.',
      );
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₦${parsedAmount.toLocaleString()} to ${activeBank.account_name} (${activeBank.bank_name} - ${activeBank.bank_account_number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              setProcessing(true);
              const result = await WalletService.initiateWithdrawal(
                user.id,
                parsedAmount,
                activeBank.bank_code,
                activeBank.bank_account_number,
                activeBank.account_name,
              );

              // Save bank account if it's a new one
              if (showBankForm && selectedBank && accountName) {
                try {
                  await ProfileService.updateBankAccount(user.id, {
                    bank_account_number: accountNumber,
                    bank_code: selectedBank.code,
                    bank_name: selectedBank.name,
                    account_name: accountName,
                  });
                } catch (err) {
                  console.error('Failed to save bank account:', err);
                  // Don't fail the withdrawal if saving bank details fails
                }
              }

              Alert.alert(
                'Withdrawal Initiated',
                result.message ||
                  'Your withdrawal is being processed. Funds will arrive within 24 hours.',
                [{ text: 'OK', onPress: () => router.back() }],
              );
            } catch (err: any) {
              Alert.alert(
                'Withdrawal Failed',
                err.message || 'Something went wrong. Please try again.',
              );
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Withdraw" />
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
      <AppHeader title="Withdraw" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Card */}
          <View
            style={[styles.balanceCard, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{walletBalance.toLocaleString()}
            </Text>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Amount
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.text }]}>
                ₦
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            {parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Minimum withdrawal is ₦{MIN_WITHDRAWAL.toLocaleString()}
                </Text>
              </View>
            )}
            {parsedAmount > walletBalance && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Amount exceeds your available balance
                </Text>
              </View>
            )}

            {/* Quick amount buttons */}
            <View style={styles.quickAmounts}>
              {[5000, 10000, 25000, 50000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    {
                      backgroundColor:
                        parsedAmount === quickAmount
                          ? colors.primary
                          : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                  disabled={quickAmount > walletBalance}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      {
                        color:
                          parsedAmount === quickAmount
                            ? '#FFFFFF'
                            : quickAmount > walletBalance
                              ? colors.textSecondary
                              : colors.text,
                      },
                    ]}
                  >
                    ₦{quickAmount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bank Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bank Account
            </Text>

            {hasSavedBank && savedBank && !showBankForm ? (
              <View>
                <View
                  style={[
                    styles.savedBankCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Building2 size={20} color={colors.primary} />
                  <View style={styles.savedBankInfo}>
                    <Text
                      style={[styles.savedBankName, { color: colors.text }]}
                    >
                      {savedBank.account_name}
                    </Text>
                    <Text
                      style={[
                        styles.savedBankDetails,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {savedBank.bank_name} - {savedBank.bank_account_number}
                    </Text>
                  </View>
                  <CheckCircle size={20} color={colors.success} />
                </View>
                <TouchableOpacity onPress={() => setShowBankForm(true)}>
                  <Text
                    style={[styles.changeBankText, { color: colors.primary }]}
                  >
                    Use a different account
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Bank Picker */}
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowBankPicker(!showBankPicker)}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      {
                        color: selectedBank
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedBank?.name || 'Select Bank'}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {showBankPicker && (
                  <View
                    style={[
                      styles.bankList,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ScrollView
                      style={styles.bankListScroll}
                      nestedScrollEnabled
                    >
                      {NIGERIAN_BANKS.map((bank) => (
                        <TouchableOpacity
                          key={bank.code}
                          style={[
                            styles.bankItem,
                            { borderBottomColor: colors.border },
                            selectedBank?.code === bank.code && {
                              backgroundColor: colors.primary + '10',
                            },
                          ]}
                          onPress={() => {
                            setSelectedBank(bank);
                            setShowBankPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.bankItemText,
                              { color: colors.text },
                            ]}
                          >
                            {bank.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Account Number */}
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={accountNumber}
                  onChangeText={(text) =>
                    setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10))
                  }
                  placeholder="Account Number (10 digits)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={10}
                />

                {/* Account Name (auto-resolved) */}
                {resolving && (
                  <View style={styles.resolvingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={[
                        styles.resolvingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Verifying account...
                    </Text>
                  </View>
                )}

                {accountName !== '' && !resolving && (
                  <View
                    style={[
                      styles.accountNameCard,
                      {
                        backgroundColor: colors.success + '10',
                        borderColor: colors.success,
                      },
                    ]}
                  >
                    <CheckCircle size={16} color={colors.success} />
                    <Text
                      style={[
                        styles.accountNameText,
                        { color: colors.success },
                      ]}
                    >
                      {accountName}
                    </Text>
                  </View>
                )}

                {hasSavedBank && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowBankForm(false);
                      setAccountNumber('');
                      setAccountName('');
                      setSelectedBank(null);
                    }}
                  >
                    <Text
                      style={[styles.changeBankText, { color: colors.primary }]}
                    >
                      Use saved account
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Withdraw Button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            { backgroundColor: canWithdraw ? colors.primary : colors.border },
          ]}
          onPress={handleWithdraw}
          disabled={!canWithdraw}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ArrowUpCircle size={20} color="#FFFFFF" />
              <Text style={styles.withdrawButtonText}>
                {parsedAmount > 0
                  ? `Withdraw ₦${parsedAmount.toLocaleString()}`
                  : 'Withdraw'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  savedBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  savedBankInfo: {
    flex: 1,
  },
  savedBankName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  savedBankDetails: {
    fontSize: 13,
  },
  changeBankText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
  },
  pickerText: {
    fontSize: 15,
  },
  bankList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bankListScroll: {
    maxHeight: 200,
  },
  bankItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bankItemText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    marginBottom: 8,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  resolvingText: {
    fontSize: 13,
  },
  accountNameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  accountNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
