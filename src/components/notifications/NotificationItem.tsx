import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { NotificationRow } from '@/hooks/useNotifications';

interface Props {
  notification: NotificationRow;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const typeIcon = (type?: string) => {
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

const borderColor = (type?: string, isRead?: boolean) => {
  const base: Record<string, string> = {
    success: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    error: 'border-l-red-500',
    info: 'border-l-blue-500',
  };
  const color = base[(type as keyof typeof base) || 'info'] || base.info;
  return `border-l-4 ${color} ${isRead ? 'bg-gray-50' : 'bg-white'}`;
};

export const NotificationItem: React.FC<Props> = ({ notification, onMarkRead, onDismiss }) => {
  const isRead = !!notification.read_at;
  return (
    <div className={`p-4 rounded-lg transition-all duration-200 hover:shadow-md ${borderColor(notification.type, isRead)}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start space-x-3">
          {typeIcon(notification.type)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</h4>
              {!isRead && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
            </div>
            <p className={`text-sm ${isRead ? 'text-gray-500' : 'text-gray-600'}`}>{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(notification.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-1 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto">
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
              title="Mark as read"
            >
              <Check className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(notification.id)}
            className="h-8 w-8 p-0 rounded-full hover:bg-red-100"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};
