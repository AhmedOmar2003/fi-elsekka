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
            // Fast path: if auth metadata already contains admin role, avoid hitting RLS
            if (user?.user_metadata?.role === 'admin') {
                setProfile({
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.username || user.email || 'Admin',
                    role: 'admin',
                });
            } else {
                const userProfile = await getUserProfile(userId);
                setProfile(userProfile);
            }
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

    const setAuthCookie = (accessToken?: string | null) => {
        if (typeof document === 'undefined') return;
        if (accessToken) {
            document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax;${window.location.protocol === 'https:' ? ' Secure' : ''}`;
        } else {
            document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax;${window.location.protocol === 'https:' ? ' Secure' : ''}`;
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // 1. Explicitly fetch the session on mount to guarantee we resolve `isLoading`
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                
                if (!mounted) return;

                if (error) {
                    console.error("AuthContext: getSession error", error);
                }

                setSession(initialSession);
                setUser(initialSession?.user ?? null);
                setAuthCookie(initialSession?.access_token);

                if (initialSession?.user) {
                    await loadProfile(initialSession.user.id);
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error("AuthContext: initialization error", err);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        // Initialize immediately
        initializeAuth();

        // 2. Listen for future auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                // When user clicks the password reset link in their email,
                // Supabase fires PASSWORD_RECOVERY. We must redirect them to
                // the update-password page before any other logic runs.
                if (event === 'PASSWORD_RECOVERY') {
                    setSession(newSession);
                    setUser(newSession?.user ?? null);
                    setIsLoading(false);
                    // Only redirect if we're not already on the update-password page
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/update-password')) {
                        window.location.href = '/update-password';
                    }
                    return;
                }

                // Explicitly handle SIGNED_OUT to guarantee state wipes
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setAuthCookie(null);
                    setIsLoading(false);
                    return;
                }

                // For other events, update state
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setAuthCookie(newSession?.access_token);

                if (newSession?.user) {
                     // Don't block UI for profile updates on subsequent events
                    loadProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }
                
                // Ensure isLoading is false once an event fires
                setIsLoading(false);
            }
        );

        return () => { 
            mounted = false;
            subscription.unsubscribe(); 
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
