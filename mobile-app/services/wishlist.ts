import { supabase } from '@/lib/supabase';

export const WishlistService = {
    async getByUser(userId: string) {
        const { data, error } = await supabase
            .from('wishlist')
            .select('product_id')
            .eq('user_id', userId);

        if (error) throw error;
        return data?.map((w) => w.product_id) || [];
    },

    async add(userId: string, productId: string) {
        const { error } = await supabase
            .from('wishlist')
            .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
    },

    async remove(userId: string, productId: string) {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .match({ user_id: userId, product_id: productId });

        if (error) throw error;
    },

    async getDetailedByUser(userId: string) {
        const { data, error } = await supabase
            .from('wishlist')
            .select(`
                id,
                product:products!inner (
                    id,
                    name,
                    price,
                    image_url,
                    description,
                    vendor_id,
                    profiles!products_vendor_id_fkey (
                        full_name
                    )
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    },

    async removeById(itemId: string) {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    },
};
