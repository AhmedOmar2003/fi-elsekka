import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import React from 'react';
import { getCategoryDesign, type CategoryDesign } from '@/lib/category-design';

export interface Category {
    id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Fetches all categories from Supabase
 */
export const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data || [];
};

export { getCategoryDesign };

/**
 * A hook that loads categories and sets up a Supabase Realtime subscription.
 */
export function useRealtimeCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadCategories = async () => {
            const data = await fetchCategories();
            if (mounted) {
                setCategories(data);
                setIsLoading(false);
            }
        };

        loadCategories();

        const channel = supabase
            .channel('public:categories')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'categories' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setCategories(prev => [...prev, payload.new as Category].sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'UPDATE') {
                        setCategories(prev => prev.map(c => c.id === payload.new.id ? (payload.new as Category) : c).sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'DELETE') {
                        setCategories(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return { categories, isLoading };
}
