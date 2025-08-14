import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Check, Trash2, MessageSquare } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import ContactManagementDialog from '@/components/learner/ContactManagementDialog';

const NotificationCenter: React.FC = () => {
  const { profile } = useAuth();
  const { loading, notifications, rawNotifications, unreadCount, filter, setFilter, actions } = useNotifications();

  const currentUnreadCount = rawNotifications.filter(n => !n.read_at).length;
  const readCount = rawNotifications.filter(n => !!n.read_at).length;

  const markAllAsRead = async () => {
    try {
      await actions.markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all as read');
    }
  };

  const dismissAllRead = async () => {
    if (!confirm('Dismiss all read notifications?')) return;
    try {
      await actions.dismissAllRead();
      toast.success('All read notifications dismissed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to dismiss read notifications');
    }
  };

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
                <span className="bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">Your mail</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                )}
              </CardTitle>
              <CardDescription>
                Stay updated with your learnership progress and important announcements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="rounded-lg"
              >
                All ({rawNotifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="rounded-lg"
              >
                Unread ({currentUnreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
                className="rounded-lg"
              >
                Read ({readCount})
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {profile?.role === 'learner' && (
                <ContactManagementDialog>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Contact Management
                  </Button>
                </ContactManagementDialog>
              )}
              {currentUnreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-lg">
                  <Check className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              {readCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissAllRead}
                  className="rounded-lg text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Dismiss Read
                </Button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'All caught up! Check back later for updates.'
                  : 'You\'ll receive notifications about your learnership progress here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => actions.markAsRead(id).catch((e) => toast.error(e.message || 'Failed to mark as read'))}
                  onDismiss={(id) => actions.dismiss(id).then(() => toast.success('Notification dismissed')).catch((e) => toast.error(e.message || 'Failed to dismiss'))}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Configure how you want to receive notifications</CardDescription>
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
