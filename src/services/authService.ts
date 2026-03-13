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
    
    // Attempt to sign out on the server
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.warn('Server signOut failed, forcing local session clear:', error.message);
        // Force local wipe if server wipe fails (e.g. due to expired token)
        await supabase.auth.signOut({ scope: 'local' });
        
        // Failsafe: clear standard supabase auth keys from local storage
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
    
    return { error: null }; // Always succeed from the client's perspective
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

export const uploadAvatar = async (userId: string, file: File) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload the file to the 'avatars' bucket
        const { error: uploadError, data } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            return { publicUrl: null, error: uploadError };
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return { publicUrl: publicUrlData.publicUrl, error: null };
    } catch (e) {
        return { publicUrl: null, error: e };
    }
};
