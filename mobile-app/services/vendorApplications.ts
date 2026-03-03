import { supabase } from '@/lib/supabase';

export const VendorApplicationService = {
    async checkExisting(userId: string) {
        const { data, error } = await supabase
            .from('vendor_applications')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['pending', 'approved'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data && !error) return data;
        return null;
    },

    async submit(application: {
        user_id: string;
        farm_name: string;
        farm_location: string;
        farm_description: string;
        business_phone: string;
        address: string;
        city: string;
        state: string;
        postal_code: string;
        delivery_zones: string[];
        business_hours: any;
        status: string;
    }) {
        const { error } = await supabase
            .from('vendor_applications')
            .insert(application);

        if (error) throw error;
    },
};
