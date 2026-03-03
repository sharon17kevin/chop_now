import { supabase } from '@/lib/supabase';

export const PaymentMethodService = {
    async getByUser(userId: string) {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async deactivate(id: string) {
        const { error } = await supabase
            .from('payment_methods')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    async clearDefaults(userId: string) {
        const { error } = await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', userId);

        if (error) throw error;
    },

    async setDefault(id: string) {
        const { error } = await supabase
            .from('payment_methods')
            .update({ is_default: true })
            .eq('id', id);

        if (error) throw error;
    },
};
