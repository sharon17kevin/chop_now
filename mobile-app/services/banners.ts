import { supabase } from '@/lib/supabase';

export const BannerService = {
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
