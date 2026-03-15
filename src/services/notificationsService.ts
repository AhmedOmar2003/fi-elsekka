import { supabase } from '@/lib/supabase';

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

/**
 * Fetches the most recent notifications for the logged-in user.
 */
export const fetchUserNotifications = async (userId: string, limit = 20): Promise<AppNotification[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error?.message || error);
        return [];
    }

    return data as AppNotification[];
};

/**
 * Marks a specific notification as read.
 */
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error marking notification as read:', error?.message || error);
        return false;
    }

    return true;
};

/**
 * Marks all unread notifications as read for a specific user.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error?.message || error);
        return false;
    }

    return true;
};

/**
 * Creates a notification for a specific user. (Usually called server-side or by an admin context)
 */
export const createNotification = async (payload: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .insert([{
            ...payload,
            is_read: false
        }]);

    if (error) {
        console.error('Error creating notification:', error?.message || error);
        return false;
    }

    return true;
};
