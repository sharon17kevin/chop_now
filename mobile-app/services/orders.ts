import { supabase } from '@/lib/supabase';

export interface CreateOrderParams {
    userId: string;
    items: any[];
    total: number;
    paymentMethod: string;
    deliveryAddress: string;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
}

export const OrderService = {
    async createOrder({
        userId,
        items,
        total,
        paymentMethod,
        deliveryAddress,
        deliveryFee,
        serviceFee,
        discount,
    }: CreateOrderParams) {
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    status: 'pending',
                    total_amount: total,
                    payment_method: paymentMethod,
                    delivery_address: deliveryAddress,
                    delivery_fee: deliveryFee,
                    service_fee: serviceFee,
                    discount_amount: discount,
                    payment_status: 'pending',
                })
                .select()
                .single();

            if (orderError) throw orderError;
            if (!order) throw new Error('Failed to create order record');

            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_time: item.products.price,
                vendor_id: item.products.vendor_id,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            const { error: clearCartError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', userId);

            if (clearCartError) {
                console.error('Failed to clear cart, but order placed:', clearCartError);
            }

            return { success: true, orderId: order.id };
        } catch (error) {
            console.error('Order creation failed:', error);
            throw error;
        }
    },

    async getOngoingOrders(userId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles:vendor_id (full_name)
            `)
            .eq('user_id', userId)
            .in('status', ['pending', 'confirmed', 'processing'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getCompletedOrders(userId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles:vendor_id (full_name)
            `)
            .eq('user_id', userId)
            .in('status', ['delivered', 'cancelled'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getVendorOrders(vendorId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('id, user_id, status')
            .eq('vendor_id', vendorId);

        if (error) throw error;
        return data || [];
    },

    async getVendorOrdersWithEarnings(vendorId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('total, status, created_at, escrow_status, vendor_payout_amount, payout_status, eligible_for_release_at')
            .eq('vendor_id', vendorId);

        if (error) throw error;
        return data || [];
    },

    async getVendorTopProducts(vendorId: string) {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                product_id,
                quantity,
                price,
                products!inner(name, image_url, vendor_id),
                orders!inner(status, vendor_id)
            `)
            .eq('orders.vendor_id', vendorId)
            .eq('orders.status', 'delivered');

        if (error) throw error;
        return data || [];
    },

    async getOrderDetailsForBreakdown(orderId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    price,
                    products (
                        id,
                        name,
                        image_url,
                        unit
                    )
                ),
                profiles:vendor_id (
                    full_name,
                    farm_name
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;
        return data;
    },

    async createOrderWithEscrow(orderData: {
        user_id: string;
        vendor_id: string;
        total: number;
        payment_reference: string;
        delivery_address: string;
        promo_code_id: string | null;
        promo_discount: number;
        platform_fee_percentage: number;
        platform_fee_amount: number;
        vendor_payout_amount: number;
    }) {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                user_id: orderData.user_id,
                vendor_id: orderData.vendor_id,
                total: orderData.total,
                payment_reference: orderData.payment_reference,
                payment_status: 'paid',
                payment_amount: orderData.total,
                status: 'pending',
                delivery_address: orderData.delivery_address,
                promo_code_id: orderData.promo_code_id,
                promo_discount: orderData.promo_discount,
                escrow_status: 'held',
                platform_fee_percentage: orderData.platform_fee_percentage,
                platform_fee_amount: orderData.platform_fee_amount,
                vendor_payout_amount: orderData.vendor_payout_amount,
                payout_status: 'on_hold',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createOrderItems(items: { order_id: string; product_id: string; quantity: number; price: number }[]) {
        const { error } = await supabase
            .from('order_items')
            .insert(items);

        if (error) throw error;
    },

    async getVendorPendingCount(vendorId: string) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId)
            .eq('status', 'pending');

        if (error) throw error;
        return count || 0;
    },

    async getOrderDetail(orderId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(
                `
                *,
                order_items (
                    id,
                    product_id,
                    quantity,
                    price,
                    products (
                        name
                    )
                ),
                profiles:user_id (
                    full_name,
                    phone
                )
            `
            )
            .eq('id', orderId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateOrderStatus(orderId: string, newStatus: string) {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
    },

    async setOrderDelivered(orderId: string, releaseDelayHours: number = 24) {
        const { data, error } = await supabase.rpc('set_order_delivered', {
            p_order_id: orderId,
            p_release_delay_hours: releaseDelayHours,
        });

        if (error) throw error;
        return data;
    },

    async getVendorOrdersDetailed(vendorId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(
                `
                id,
                user_id,
                status,
                total,
                created_at,
                order_items (
                    id,
                    product_id,
                    quantity,
                    price,
                    products!inner (
                        name
                    )
                ),
                profiles!user_id (
                    full_name,
                    phone
                )
            `
            )
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async cancelOrder(orderId: string, reason: string, refundMethod: string = 'wallet') {
        const { data, error } = await supabase.functions.invoke(
            'cancel-order',
            {
                body: {
                    order_id: orderId,
                    reason,
                    refund_method: refundMethod,
                },
            }
        );

        if (error) throw error;
        return data;
    },

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },
};
