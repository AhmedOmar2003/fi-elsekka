import { supabase } from '@/lib/supabase';

export interface DiscountCode {
    id: number;
    code: string;
    discount_percentage: number | null;
    discount_amount: number | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Validates a discount code and returns the discount record if valid.
 */
export const validateDiscountCode = async (code: string): Promise<DiscountCode | null> => {
    const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

    if (error || !data) return null;
    return data as DiscountCode;
};

/**
 * Calculates the final price after applying a discount code.
 */
export const applyDiscount = (originalPrice: number, discount: DiscountCode): {
    finalPrice: number;
    savedAmount: number;
    label: string;
} => {
    let finalPrice = originalPrice;
    let savedAmount = 0;
    let label = '';

    if (discount.discount_percentage) {
        savedAmount = Math.round(originalPrice * discount.discount_percentage / 100);
        finalPrice = originalPrice - savedAmount;
        label = `خصم ${discount.discount_percentage}% (وفرت ${savedAmount} ج.م)`;
    } else if (discount.discount_amount) {
        savedAmount = Math.min(discount.discount_amount, originalPrice);
        finalPrice = originalPrice - savedAmount;
        label = `خصم ${savedAmount} ج.م ثابت`;
    }

    return { finalPrice: Math.max(0, finalPrice), savedAmount, label };
};

// ── Admin CRUD ─────────────────────────────────────────────────────────────

export const fetchAllDiscountCodes = async (): Promise<DiscountCode[]> => {
    const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('fetchAllDiscountCodes:', error.message); return []; }
    return data || [];
};

export const createDiscountCode = async (payload: Omit<DiscountCode, 'id' | 'created_at'>) => {
    return supabase.from('discount_codes').insert([{ ...payload, code: payload.code.toUpperCase() }]).select().single();
};

export const updateDiscountCode = async (id: number, payload: Partial<Omit<DiscountCode, 'id' | 'created_at'>>) => {
    if (payload.code) payload.code = payload.code.toUpperCase();
    return supabase.from('discount_codes').update(payload).eq('id', id).select().single();
};

export const deleteDiscountCode = async (id: number) => {
    return supabase.from('discount_codes').delete().eq('id', id);
};
