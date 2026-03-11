import { supabase } from "../lib/supabase";

export const ProductService = {
    async fetchAll() {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return data;
    },

    async add(product: any) {
        const { data, error } = await supabase.from('products').insert([product]);
        if (error) throw error;
        return data;
    },

    async getByVendor(vendorId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendorId)
            .eq('is_available', true)
            .eq('status', 'approved')
            .order('category')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getHomeProducts() {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                profiles:vendor_id (full_name)
            `)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getByCategory(category: string | null) {
        const query = supabase
            .from('products')
            .select(`
                *,
                profiles:vendor_id (full_name)
            `)
            .eq('is_available', true)
            .eq('status', 'approved');

        if (category && category !== 'All') {
            query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getLowStockCount(vendorId: string) {
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId)
            .lt('stock', 10)
            .eq('is_available', true);

        if (error) throw error;
        return count || 0;
    },

    async getVendorStock(vendorId: string) {
        const { data, error } = await supabase
            .from('products')
            .select(
                'id, name, category, stock, price, unit, is_available, image_url, discount_percentage, original_price, is_on_sale, sale_ends_at',
            )
            .eq('vendor_id', vendorId)
            .order('stock', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getProductDetail(productId: string) {
        const { data, error } = await supabase
            .from('products')
            .select(
                'id, name, category, stock, price, unit, is_available, image_url, discount_percentage, original_price, is_on_sale, sale_ends_at, minimum_order_quantity, order_increment, bulk_discount_tiers, description',
            )
            .eq('id', productId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateStock(productId: string, newStock: number) {
        const { error } = await supabase
            .from('products')
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (error) throw error;
    },

    async updatePrice(productId: string, price: number) {
        const { error } = await supabase
            .from('products')
            .update({ price, updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (error) throw error;
    },

    async updatePromotion(productId: string, updateData: any) {
        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId);

        if (error) throw error;
    },

    async deleteProduct(productId: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
    },

    async addProduct(product: any) {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async search(searchQuery: string, filters?: {
        category?: string | null;
        minPrice?: number | null;
        maxPrice?: number | null;
        sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'name' | null;
        vendorId?: string | null;
    }) {
        const searchPattern = `%${searchQuery.trim()}%`;
        let query = supabase
            .from('products')
            .select(`
                *,
                vendor:vendor_id (
                    full_name
                )
            `)
            .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .eq('is_available', true);

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.minPrice !== null && filters?.minPrice !== undefined) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters?.maxPrice !== null && filters?.maxPrice !== undefined) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters?.vendorId) {
            query = query.eq('vendor_id', filters.vendorId);
        }

        switch (filters?.sortBy) {
            case 'price_asc':
                query = query.order('price', { ascending: true });
                break;
            case 'price_desc':
                query = query.order('price', { ascending: false });
                break;
            case 'name':
                query = query.order('name', { ascending: true });
                break;
            case 'recent':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        query = query.limit(50);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
};

// Keep backward-compatible named exports
export async function fetchProducts() {
    return ProductService.fetchAll();
}

export async function addProduct(product: any) {
    return ProductService.add(product);
}
