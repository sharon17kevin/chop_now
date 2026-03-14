import { supabase } from '@/lib/supabase';

export interface BannerInput {
    title: string;
    subtitle?: string | null;
    image_url: string;
    action_type: 'product' | 'vendor' | 'category' | 'url';
    action_id?: string | null;
    action_url?: string | null;
    is_active: boolean;
    display_order: number;
    start_date: string;
    end_date?: string | null;
}

export const BannerService = {
    async getAllBanners() {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createBanner(banner: BannerInput) {
        const { data, error } = await supabase
            .from('banners')
            .insert(banner)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateBanner(id: string, updates: Partial<BannerInput>) {
        const { data, error } = await supabase
            .from('banners')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBanner(id: string) {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getActiveBanners() {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', now)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async incrementImpressions(bannerId: string) {
        const { error } = await supabase.rpc('increment_banner_impressions', {
            banner_id: bannerId,
        });

        if (error && error.code === '42883') {
            const { data: banner } = await supabase
                .from('banners')
                .select('impressions')
                .eq('id', bannerId)
                .single();

            if (banner) {
                await supabase
                    .from('banners')
                    .update({ impressions: (banner.impressions || 0) + 1 })
                    .eq('id', bannerId);
            }
        } else if (error) {
            throw error;
        }
    },

    async incrementClicks(bannerId: string) {
        const { error } = await supabase.rpc('increment_banner_clicks', {
            banner_id: bannerId,
        });

        if (error && error.code === '42883') {
            const { data: banner } = await supabase
                .from('banners')
                .select('clicks')
                .eq('id', bannerId)
                .single();

            if (banner) {
                await supabase
                    .from('banners')
                    .update({ clicks: (banner.clicks || 0) + 1 })
                    .eq('id', bannerId);
            }
        } else if (error) {
            throw error;
        }
    },
};
