import { supabase } from '@/lib/supabase';

export const ProfileService = {
    async getVendorProfile(vendorId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', vendorId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getProfileAddress(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('selected_address_id, address, city, state')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateSelectedAddress(userId: string, addressId: string | null) {
        const { error } = await supabase
            .from('profiles')
            .update({ selected_address_id: addressId })
            .eq('id', userId);

        if (error) throw error;
    },

    async getWalletBalance(userId: string) {
        const { data, error } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (error) {
            // Wallet might not exist yet
            return 0;
        }
        return data?.balance || 0;
    },

    async updateProfile(userId: string, updates: Record<string, any>) {
        const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;
    },

    async getPushNotificationSetting(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('push_notifications_enabled')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.push_notifications_enabled;
    },

    async updatePushNotificationSetting(userId: string, value: boolean) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ push_notifications_enabled: value })
            .eq('id', userId)
            .select();

        if (error) throw error;
        return data;
    },

    async getAdminUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'admin');

        if (error) throw error;
        return data || [];
    },

    async getProfileWalletBalance(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.wallet_balance || 0;
    },
};
