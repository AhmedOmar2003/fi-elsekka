"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserProfile, UserProfile } from '@/services/authService';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ref to prevent concurrent profile fetches
    const fetchingProfile = useRef(false);

    const loadProfile = async (userId: string) => {
        // Guard: skip if already in-flight
        if (fetchingProfile.current) return;
        fetchingProfile.current = true;
        try {
            const userProfile = await getUserProfile(userId);
            setProfile(userProfile);
        } catch (err: unknown) {
            // Silently swallow AbortError — it's a transient lock conflict
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes('AbortError') && !msg.includes('Lock broken')) {
                console.error('AuthContext: loadProfile error', err);
            }
        } finally {
            fetchingProfile.current = false;
        }
    };

    const refreshProfile = async () => {
        if (user?.id) await loadProfile(user.id);
    };

    useEffect(() => {
        // Use ONLY onAuthStateChange as the single source of truth.
        // This avoids concurrent getSession() + onAuthStateChange() calls
        // that cause the "Lock broken" AbortError.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    await loadProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => { subscription.unsubscribe(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
