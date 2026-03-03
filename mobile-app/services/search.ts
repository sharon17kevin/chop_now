import { supabase } from '@/lib/supabase';

export const SearchService = {
    async getPopularSearches(limit: number = 8) {
        const { data, error } = await supabase
            .from('search_analytics')
            .select('search_query, search_count')
            .order('search_count', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data?.map((item) => item.search_query) || [];
    },

    async saveSearchAnalytics(query: string) {
        await supabase.rpc('increment_search_count', {
            p_search_query: query.trim().toLowerCase(),
        });
    },
};
