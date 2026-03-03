import { supabase } from '@/lib/supabase';

export const AddressService = {
    async getByUser(userId: string) {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async create(address: {
        user_id: string;
        label: string | null;
        street: string;
        city: string;
        state: string;
        country: string;
        postal_code: string | null;
    }) {
        const { data, error } = await supabase
            .from('addresses')
            .insert(address)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async remove(id: string) {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
