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
    /**
     * Creates a new order and clears the user's cart
     */
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
            // 1. Create the Order Record
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
                    payment_status: 'pending', // In a real app, this would update after gateway success
                })
                .select()
                .single();

            if (orderError) throw orderError;
            if (!order) throw new Error('Failed to create order record');

            // 2. Create Order Items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_time: item.products.price, // Lock in price
                vendor_id: item.products.vendor_id,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Clear Cart
            const { error: clearCartError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', userId);

            if (clearCartError) {
                console.error('Failed to clear cart, but order placed:', clearCartError);
                // We don't throw hered because the order is technically safe
            }

            return { success: true, orderId: order.id };
        } catch (error) {
            console.error('Order creation failed:', error);
            throw error;
        }
    },
};
