import { supabase } from '@/lib/supabase';

export const WalletService = {
    async getTransactions(userId: string, limit: number = 20) {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async initiateWithdrawal(
        userId: string,
        amount: number,
        bankCode: string,
        accountNumber: string,
        accountName: string
    ) {
        const { data, error } = await supabase.functions.invoke(
            'paystack-initiate-transfer',
            {
                body: {
                    user_id: userId,
                    amount,
                    bank_code: bankCode,
                    account_number: accountNumber,
                    account_name: accountName,
                },
            }
        );

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Withdrawal failed');
        return data;
    },

    async resolveAccount(accountNumber: string, bankCode: string) {
        const { data, error } = await supabase.functions.invoke(
            'paystack-resolve-account',
            {
                body: { account_number: accountNumber, bank_code: bankCode },
            }
        );

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Could not resolve account');
        return data;
    },

    async getWithdrawalHistory(userId: string) {
        const { data, error } = await supabase
            .from('vendor_payouts')
            .select('*')
            .eq('vendor_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },
};
