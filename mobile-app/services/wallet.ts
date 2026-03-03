import { supabase } from '@/lib/supabase';

export const WalletService = {
    async getTransactions(userId: string, limit: number = 20) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};
