
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.read_at)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: notif.read_at || new Date().toISOString() }))
      );

      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteAllRead = async () => {
    if (!confirm('Are you sure you want to delete all read notifications?')) return;

    try {
      const readIds = notifications
        .filter(notif => notif.read_at)
        .map(notif => notif.id);

      if (readIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => !notif.read_at));
      toast.success('All read notifications deleted');
    } catch (error: any) {
      toast.error('Failed to delete notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBorderColor = (type: string, isRead: boolean) => {
    const baseColors = {
      success: 'border-l-green-500',
      warning: 'border-l-yellow-500',
      error: 'border-l-red-500',
      info: 'border-l-blue-500'
    };
    
    return `border-l-4 ${baseColors[type as keyof typeof baseColors] || baseColors.info} ${
      isRead ? 'bg-gray-50' : 'bg-white'
    }`;
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || (filter === 'unread' && !notif.read_at)
  );

  const unreadCount = notifications.filter(notif => !notif.read_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#122ec0]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-6 w-6 text-[#122ec0]" />
                <span className="bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Stay updated with your learnership progress and important announcements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="rounded-lg"
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="rounded-lg"
              >
                Unread ({unreadCount})
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="rounded-lg"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              {notifications.some(n => n.read_at) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteAllRead}
                  className="rounded-lg text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Read
                </Button>
              )}
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for updates.'
                  : 'You\'ll receive notifications about your learnership progress here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg transition-all duration-200 hover:shadow-md ${getNotificationBorderColor(notification.type, !!notification.read_at)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${notification.read_at ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read_at && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm ${notification.read_at ? 'text-gray-500' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-100"
                        title="Delete notification"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Monthly feedback reminders</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Document upload confirmations</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Achievement notifications</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Overdue submission alerts</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
