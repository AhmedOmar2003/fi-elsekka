import { supabase } from '@/lib/supabase';
import { CartItem } from './cartService';
import { Product } from './productsService';

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

export const createOrder = async (
    userId: string,
    cartItems: any[], // Allows CartItem or GuestCartItem union from CartContext
    shippingDetails: any,
    totalAmount: number
) => {
    // 1. Create the Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            status: 'pending',
            total_amount: totalAmount,
            shipping_address: shippingDetails
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

export const updateUserProfile = async (userId: string, updates: any) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
};
