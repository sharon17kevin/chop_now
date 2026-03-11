import { supabase } from '@/lib/supabase';

export const ProfileService = {
    async getVendorProfile(vendorId: string) {
        console.log('Fetching vendor profile for:', vendorId);
        
        // First try to get the vendor profile with public fields
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                profile_image,
                banner_image,
                role,
                verified,
                farm_name,
                farm_location,
                farm_description,
                business_phone,
                address,
                city,
                state,
                business_hours,
                delivery_zones,
                rating,
                total_orders,
                total_sales,
                favorite_count,
                created_at,
                updated_at
            `)
            .eq('id', vendorId)
            .eq('role', 'vendor')
            .maybeSingle();

        if (error) {
            console.error('Error fetching vendor profile:', error);
            throw new Error(`Failed to fetch vendor profile: ${error.message}`);
        }
        
        if (!data) {
            throw new Error('Vendor not found or not accessible');
        }
        
        console.log('Vendor profile fetched successfully:', data.full_name);
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

    async getBankAccount(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('bank_account_number, bank_code, bank_name, account_name, bank_account_verified')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateBankAccount(userId: string, bankDetails: {
        bank_account_number: string;
        bank_code: string;
        bank_name: string;
        account_name: string;
    }) {
        const { error } = await supabase
            .from('profiles')
            .update({
                ...bankDetails,
                bank_account_verified: true,
                bank_account_verified_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) throw error;
    },
};
