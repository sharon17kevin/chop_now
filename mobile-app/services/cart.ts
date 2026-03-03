import { supabase } from '@/lib/supabase';

export const CartService = {
    async getCartItems(userId: string) {
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                products:product_id (
                    id,
                    name,
                    price,
                    image_url,
                    unit,
                    vendor_id,
                    profiles:vendor_id (full_name)
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    },

    async getExistingCartItem(userId: string, productId: string) {
        const { data, error } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async updateQuantity(cartItemId: string, quantity: number) {
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItemId);

        if (error) throw error;
    },

    async addItem(userId: string, productId: string, quantity: number) {
        const { error } = await supabase
            .from('cart_items')
            .insert({
                user_id: userId,
                product_id: productId,
                quantity,
            });

        if (error) throw error;
    },

    async getExistingCartItemMaybe(userId: string, productId: string) {
        const { data, error } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async removeItem(cartItemId: string) {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;
    },

    async clearCart(userId: string) {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },
};
