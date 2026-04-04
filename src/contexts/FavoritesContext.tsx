"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchFavoriteIds, addFavorite, removeFavorite, clearAllFavorites as clearAllFavoritesApi } from '@/services/favoritesService';
import { getSafeLocalStorage, safeJsonParse } from '@/lib/browser-storage';

const GUEST_KEY = 'guest_favorites';
const storage = getSafeLocalStorage()

interface FavoritesContextValue {
    favoriteIds: Set<string>;
    isLoading: boolean;
    isFavorite: (productId: string) => boolean;
    toggleFavorite: (productId: string) => Promise<void>;
    clearAllFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
    favoriteIds: new Set(),
    isLoading: false,
    isFavorite: () => false,
    toggleFavorite: async () => {},
    clearAllFavorites: async () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Load favorites when user changes
    useEffect(() => {
        if (user) {
            // Authenticated: load from Supabase
            setIsLoading(true);
            fetchFavoriteIds(user.id).then(ids => {
                setFavoriteIds(new Set(ids));
                setIsLoading(false);
            });
        } else {
            // Guest: load from localStorage
            const ids = safeJsonParse<string[]>(storage.getItem(GUEST_KEY), []);
            setFavoriteIds(new Set(ids));
        }
    }, [user]);

    const isFavorite = useCallback((productId: string) => {
        return favoriteIds.has(productId);
    }, [favoriteIds]);

    const toggleFavorite = useCallback(async (productId: string) => {
        const alreadyFav = favoriteIds.has(productId);

        // Optimistic update
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (alreadyFav) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });

        if (user) {
            // Persist in Supabase
            if (alreadyFav) {
                await removeFavorite(user.id, productId);
            } else {
                await addFavorite(user.id, productId);
            }
        } else {
            // Persist in localStorage for guests
            setFavoriteIds(prev => {
                const ids = Array.from(prev);
                storage.setItem(GUEST_KEY, JSON.stringify(ids));
                return prev;
            });
        }
    }, [user, favoriteIds]);

    const clearAll = useCallback(async () => {
        setFavoriteIds(new Set());
        if (user) {
            await clearAllFavoritesApi(user.id);
        } else {
            storage.removeItem(GUEST_KEY);
        }
    }, [user]);

    return (
        <FavoritesContext.Provider value={{ favoriteIds, isLoading, isFavorite, toggleFavorite, clearAllFavorites: clearAll }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}
