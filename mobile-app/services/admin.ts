import { supabase } from '@/lib/supabase';
import { NotificationService } from './notifications';

export interface PromoCodeInput {
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    per_user_limit?: number;
    valid_from?: string;
    valid_until?: string | null;
    is_active?: boolean;
    vendor_id?: string | null;
    applicable_categories?: string[];
}

export const AdminService = {
    // Vendor Applications
    async getPendingVendorApplications() {
        const { data, error } = await supabase
            .from('vendor_applications')
            .select(`
                *,
                profiles:user_id(full_name, email)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async approveVendorApplication(applicationId: string, adminId: string) {
        const { error } = await supabase.rpc('approve_vendor_application', {
            application_id: applicationId,
            admin_id: adminId,
        });

        if (error) throw error;
    },

    async rejectVendorApplication(applicationId: string, adminId: string, rejectionReason: string) {
        const { error } = await supabase.rpc('reject_vendor_application', {
            application_id: applicationId,
            admin_id: adminId,
            rejection_reason: rejectionReason,
        });

        if (error) throw error;
    },

    // Product Review
    async getPendingProducts(categoryFilter?: string) {
        let query = supabase
            .from('products')
            .select(`
                *,
                profiles:vendor_id(full_name, business_name)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (categoryFilter && categoryFilter !== 'all') {
            query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    async approveProduct(productId: string, adminId: string) {
        const { error } = await supabase.rpc('approve_product', {
            product_id: productId,
            admin_id: adminId,
        });

        if (error) throw error;
    },

    async rejectProduct(productId: string, adminId: string, rejectionReason: string) {
        const { error } = await supabase.rpc('reject_product', {
            product_id: productId,
            admin_id: adminId,
            rejection_reason: rejectionReason,
        });

        if (error) throw error;
    },

    // Dashboard Stats
    async getDashboardStats() {
        // Fetch vendor applications stats
        const { data: applications, error: appError } = await supabase
            .from('vendor_applications')
            .select('status');

        if (appError) throw appError;

        const pending = applications?.filter((a) => a.status === 'pending').length || 0;
        const approved = applications?.filter((a) => a.status === 'approved').length || 0;
        const rejected = applications?.filter((a) => a.status === 'rejected').length || 0;

        // Fetch total products
        const { count: productsCount, error: productsError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (productsError) throw productsError;

        // Fetch pending products
        const { count: pendingProductsCount, error: pendingProductsError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (pendingProductsError) throw pendingProductsError;

        // Fetch total orders
        const { count: ordersCount, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (ordersError) throw ordersError;

        // Fetch total users
        const { count: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        return {
            pendingApplications: pending,
            approvedVendors: approved,
            rejectedApplications: rejected,
            totalProducts: productsCount || 0,
            pendingProducts: pendingProductsCount || 0,
            totalOrders: ordersCount || 0,
            totalUsers: usersCount || 0,
        };
    },

    // Analytics
    async getAnalyticsData() {
        // Fetch total orders and revenue
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total, created_at, status');

        if (ordersError) throw ordersError;

        // Fetch active vendors
        const { count: vendorsCount, error: vendorsError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'vendor')
            .eq('verified', true);

        if (vendorsError) throw vendorsError;

        // Fetch total products
        const { count: productsCount, error: productsError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('is_available', true);

        if (productsError) throw productsError;

        // Fetch top vendors by sales
        const { data: topVendorsData, error: topVendorsError } = await supabase
            .from('orders')
            .select('vendor_id, total, profiles!orders_vendor_id_fkey(farm_name)')
            .order('total', { ascending: false })
            .limit(5);

        if (topVendorsError) throw topVendorsError;

        // Fetch top products
        const { data: topProductsData, error: topProductsError } = await supabase
            .from('order_items')
            .select('product_id, quantity, price, products(name)')
            .order('quantity', { ascending: false })
            .limit(100);

        if (topProductsError) throw topProductsError;

        return {
            orders: orders || [],
            vendorsCount: vendorsCount || 0,
            productsCount: productsCount || 0,
            topVendorsData: topVendorsData || [],
            topProductsData: topProductsData || [],
        };
    },

    // Promo code validation (RPC)
    async validatePromoCode(code: string, userId: string, orderTotal: number, vendorId: string | null) {
        const { data, error } = await supabase.rpc('validate_promo_code', {
            p_code: code,
            p_user_id: userId,
            p_order_total: orderTotal,
            p_vendor_id: vendorId,
        });

        if (error) throw error;
        return typeof data === 'string' ? JSON.parse(data) : data;
    },

    // Record promo usage (RPC)
    async recordPromoUsage(promoCodeId: string, userId: string, orderId: string, discountAmount: number) {
        const { error } = await supabase.rpc('record_promo_usage', {
            p_promo_code_id: promoCodeId,
            p_user_id: userId,
            p_order_id: orderId,
            p_discount_amount: discountAmount,
        });

        if (error) throw error;
    },

    // Promo Code CRUD
    async getPromoCodes() {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createPromoCode(promo: PromoCodeInput) {
        const { data, error } = await supabase
            .from('promo_codes')
            .insert(promo)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePromoCode(id: string, updates: Partial<PromoCodeInput>) {
        const { data, error } = await supabase
            .from('promo_codes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deletePromoCode(id: string) {
        const { error } = await supabase
            .from('promo_codes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Broadcast Notifications
    async broadcastNotification(
        title: string,
        message: string,
        type: 'promotion' | 'alert' | 'system',
        targetRole?: 'customer' | 'vendor' | null,
    ) {
        // Get target user IDs
        let query = supabase.from('profiles').select('id');
        if (targetRole) {
            query = query.eq('role', targetRole);
        }

        const { data: users, error: usersError } = await query;
        if (usersError) throw usersError;
        if (!users || users.length === 0) {
            return { notified: 0, pushed: 0 };
        }

        // Insert in-app notifications
        const notifications = users.map((u) => ({
            user_id: u.id,
            title,
            message,
            type,
            is_read: false,
        }));

        await NotificationService.createBulk(notifications);

        // Send push notifications via edge function
        let pushed = 0;
        try {
            const { data, error } = await supabase.functions.invoke('send-notification', {
                body: {
                    title,
                    message,
                    role: targetRole || undefined,
                    type,
                },
            });

            if (!error && data) {
                pushed = data.sent || 0;
            }
        } catch (e) {
            console.error('Push notification failed:', e);
        }

        return { notified: users.length, pushed };
    },
};
