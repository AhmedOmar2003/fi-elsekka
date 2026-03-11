import { supabase } from '@/lib/supabase';

export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    profile_picture?: string;
    role?: 'admin' | 'user';
    created_at?: string;
}

export const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    // Supabase will automatically send a verification email if that's configured in the dashboard.
    return { data, error };
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('guestCart');
    }
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        // AbortError is a transient lock conflict — ignore it silently
        if (error.message?.includes('AbortError') || error.message?.includes('Lock broken')) {
            return null;
        }
        console.error('Error fetching user profile:', error?.message || error);
        return null;
    }

    return data as UserProfile;
};

export const updateAuthEmail = async (newEmail: string) => {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    return { data, error };
};

export const updateAuthPassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
};
