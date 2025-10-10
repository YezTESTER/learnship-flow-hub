import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';

interface ContactManagementDialogProps {
  children: React.ReactNode;
}

const ContactManagementDialog: React.FC<ContactManagementDialogProps> = ({ children }) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending message to admins via RPC function...');
      
      // Use the new RPC function to send message to all admins
      const { data, error } = await supabase
        .rpc('send_message_to_admins', {
          sender_id: profile?.id,
          message_title: title,
          message_content: message
        });

      if (error) {
        console.error('Error calling send_message_to_admins RPC:', error);
        
        // Provide user-friendly error messages
        if (error.message && error.message.includes('No admin users found')) {
          throw new Error('No management personnel are currently available to receive messages. Please contact support for assistance.');
        } else if (error.message && error.message.includes('Invalid sender')) {
          throw new Error('Unable to send message due to account validation issues. Please contact support.');
        } else if (error.message && error.message.includes('permission')) {
          throw new Error('Unable to send message due to system permissions. Please contact support.');
        }
        
        throw new Error('Failed to send message. Please try again later.');
      }

      console.log('Message sent successfully. Notification IDs:', data);
      
      toast.success('Message sent to management successfully!');
      setTitle('');
      setMessage('');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again later.');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Contact Management</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter subject..."
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to management..."
              className="min-h-24 w-full"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              disabled={loading || !title.trim() || !message.trim()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactManagementDialog;