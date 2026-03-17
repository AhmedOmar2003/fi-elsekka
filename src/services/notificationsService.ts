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

const logNotificationMutationFailure = (action: string, details: Record<string, unknown>) => {
    console.error(`[notifications] ${action} failed`, details);
};

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
    if (!notificationId || !userId) return false;

    const { data: existingRows, error: existingError } = await supabase
        .from('notifications')
        .select('id')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .limit(1);

    if (existingError) {
        logNotificationMutationFailure('mark-read.lookup', { notificationId, userId, error: existingError.message || existingError });
        return false;
    }

    if (!existingRows || existingRows.length === 0) {
        return true;
    }

    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id');

    if (error) {
        logNotificationMutationFailure('mark-read.update', { notificationId, userId, error: error.message || error });
        return false;
    }

    const updatedRows = data ?? [];
    if (updatedRows.length === 0) {
        logNotificationMutationFailure('mark-read.no-rows', { notificationId, userId });
        return false;
    }

    return true;
};

/**
 * Marks all unread notifications as read for a specific user.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    const { data: unreadRows, error: unreadError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);

    if (unreadError) {
        logNotificationMutationFailure('mark-all.lookup', { userId, error: unreadError.message || unreadError });
        return false;
    }

    if (!unreadRows || unreadRows.length === 0) {
        return true;
    }

    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select('id');

    if (error) {
        logNotificationMutationFailure('mark-all.update', { userId, error: error.message || error });
        return false;
    }

    const updatedRows = data ?? [];
    if (updatedRows.length !== unreadRows.length) {
        logNotificationMutationFailure('mark-all.partial', { userId, expected: unreadRows.length, actual: updatedRows.length });
        return false;
    }

    return true;
};

/**
 * Deletes a specific notification owned by the user.
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<boolean> => {
    if (!notificationId || !userId) return false;

    const { data: existingRows, error: existingError } = await supabase
        .from('notifications')
        .select('id')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .limit(1);

    if (existingError) {
        logNotificationMutationFailure('delete-one.lookup', { notificationId, userId, error: existingError.message || existingError });
        return false;
    }

    if (!existingRows || existingRows.length === 0) {
        return true;
    }

    const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id');

    if (error) {
        logNotificationMutationFailure('delete-one.delete', { notificationId, userId, error: error.message || error });
        return false;
    }

    const deletedRows = data ?? [];
    if (deletedRows.length === 0) {
        logNotificationMutationFailure('delete-one.no-rows', { notificationId, userId });
        return false;
    }

    return true;
};

/**
 * Deletes all notifications for a specific user.
 */
export const deleteAllNotifications = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    const { data: existingRows, error: existingError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId);

    if (existingError) {
        logNotificationMutationFailure('delete-all.lookup', { userId, error: existingError.message || existingError });
        return false;
    }

    if (!existingRows || existingRows.length === 0) {
        return true;
    }

    const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .select('id');

    if (error) {
        logNotificationMutationFailure('delete-all.delete', { userId, error: error.message || error });
        return false;
    }

    const deletedRows = data ?? [];
    if (deletedRows.length !== existingRows.length) {
        logNotificationMutationFailure('delete-all.partial', { userId, expected: existingRows.length, actual: deletedRows.length });
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
