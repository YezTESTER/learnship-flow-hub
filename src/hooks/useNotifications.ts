import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType | string;
  read_at: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export type NotificationFilter = 'all' | 'unread' | 'read';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: single subscription per user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read_at).length, [notifications]);

  // Actions
  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    if (error) throw error;
    await fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .is('read_at', null);
    if (error) throw error;
    await fetchNotifications();
  }, [user?.id, fetchNotifications]);

  const dismiss = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    if (error) throw error;
    await fetchNotifications();
  }, [fetchNotifications]);

  const dismissAllRead = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .not('read_at', 'is', null)
      .is('deleted_at', null);
    if (error) throw error;
    await fetchNotifications();
  }, [user?.id, fetchNotifications]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read_at);
      case 'read':
        return notifications.filter(n => !!n.read_at);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return {
    loading,
    notifications: filtered,
    rawNotifications: notifications,
    unreadCount,
    filter,
    setFilter,
    actions: { markAsRead, markAllAsRead, dismiss, dismissAllRead, refresh: fetchNotifications },
  };
}
