import { supabase } from '@/lib/supabase';

export const VirtualAccountService = {
    async getByUser(userId: string) {
        const { data, error } = await supabase
            .from('virtual_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    },
};
