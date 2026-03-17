import { supabase } from '@/lib/supabase';
import { CartItem } from './cartService';
import { Product } from './productsService';
import { attachOrderEconomics, CURRENT_DELIVERY_FEE } from '@/lib/order-economics';

export interface Order {
    id: string;
    user_id: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    shipping_address: any;
    created_at: string;
    order_items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product?: Product; // joined details
}

export type CancelledOrderDecision = 'insist' | 'confirm_cancel';
type CustomerCancelOrigin = 'grace_period' | 'account';

export const createOrder = async (
    userId: string,
    cartItems: any[], // Allows CartItem or GuestCartItem union from CartContext
    shippingDetails: any,
    subtotalAmount: number
) => {
    const shippingWithEconomics = attachOrderEconomics(
        shippingDetails,
        subtotalAmount + CURRENT_DELIVERY_FEE,
        0
    );

    // 1. Create the Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            status: 'pending',
            total_amount: shippingWithEconomics.gross_collected,
            shipping_address: shippingWithEconomics
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating order:', orderError?.message || orderError);
        return { error: orderError };
    }

    // 2. Prepare Order Items
    const orderItems = cartItems.map(item => {
        let finalPrice = item.product?.price || 0;
        if (item.product?.discount_percentage && item.product.discount_percentage > 0) {
            finalPrice = Math.round(finalPrice * (1 - item.product.discount_percentage / 100));
        }
        return {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: finalPrice
        };
    });

    // 3. Insert Order Items
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Error creating order items:', itemsError?.message || itemsError);
        return { error: itemsError };
    }

    // 4. Clear the cart
    const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

    if (clearError) {
        console.error('Failed to clear cart after order:', clearError?.message);
    }

    return { data: order };
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id, product_id, quantity, price_at_purchase,
                product:products (name, price)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user orders:', error?.message || error);
        return [];
    }

    return (data || []) as unknown as Order[];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

    return { data, error };
};

export const cancelOrderByCustomer = async (orderId: string, origin: CustomerCancelOrigin = 'grace_period') => {
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('shipping_address')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        return { data: null, error: orderError || new Error("Order not found") };
    }

    const currentShipping = order.shipping_address || {};
    const now = new Date().toISOString();
    const duringGracePeriod = currentShipping.is_grace_period === true;
    const nextShipping = {
        ...currentShipping,
        customer_cancelled_order: true,
        customer_cancelled_during_grace_period: duringGracePeriod,
        customer_cancel_origin: origin,
        customer_cancelled_at: now,
        customer_cancelled_reason: duringGracePeriod ? 'cancelled_by_customer_within_grace_period' : 'cancelled_by_customer',
    };

    const { data, error } = await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            shipping_address: nextShipping,
        })
        .eq('id', orderId)
        .select()
        .single();

    return { data, error };
};

export const confirmOrderGracePeriod = async (orderId: string) => {
    // We update the shipping_address JSON to set is_grace_period: false
    // Since we don't know the exact JSON shape without fetching, we fetch first.
    const { data: order } = await supabase.from('orders').select('shipping_address').eq('id', orderId).single();
    if (!order || !order.shipping_address) return { error: new Error("Order not found") };

    const newShipping = { ...order.shipping_address, is_grace_period: false };
    
    const { data, error } = await supabase
        .from('orders')
        .update({ shipping_address: newShipping })
        .eq('id', orderId)
        .select()
        .single();

    return { data, error };
};

export const respondToCancelledOrder = async (orderId: string, decision: CancelledOrderDecision) => {
    const res = await fetch(`/api/orders/${orderId}/cancel-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.error || 'فشل إرسال ردك على الإلغاء');
    }
    return data as { success: true; decision: CancelledOrderDecision; shipping_address: any };
};

export const updateUserProfile = async (userId: string, updates: any) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
};
