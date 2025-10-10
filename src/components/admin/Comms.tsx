import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, MessageSquare, User, Clock, Mail, Inbox } from 'lucide-react';
import { format } from 'date-fns';

interface LearnerProfile {
  id: string;
  full_name: string;
  email: string;
  employer_name?: string;
  learnership_program?: string;
}

interface Message {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at?: string;
  user_id: string;
  sender_id?: string;
  message_type: string;
  user?: {
    full_name: string;
    email: string;
  };
}

const Comms: React.FC = () => {
  const { profile } = useAuth();
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'send' | 'inbox'>('send');

  useEffect(() => {
    fetchLearners();
    fetchInboxMessages();
  }, []);

  const fetchLearners = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, employer_name, learnership_program')
        .eq('role', 'learner')
        .order('full_name');

      if (error) throw error;
      setLearners(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch learners');
      console.error('Error fetching learners:', error);
    }
  };

  const fetchInboxMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          created_at,
          read_at,
          user_id,
          sender_id,
          message_type
        `)
        .eq('message_type', 'learner_to_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch sender information for each message
      const messagesWithSenders = await Promise.all(
        data?.map(async (msg) => {
          if (msg.sender_id) {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', msg.sender_id)
              .single();
            
            if (!senderError && senderData) {
              return {
                ...msg,
                user: senderData
              };
            }
          }
          return {
            ...msg,
            user: {
              full_name: 'Unknown User',
              email: 'unknown@example.com'
            }
          };
        }) || []
      );
      
      setInboxMessages(messagesWithSenders);
    } catch (error: any) {
      toast.error('Failed to fetch inbox messages');
      console.error('Error fetching inbox messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedLearner || !messageTitle.trim() || !messageContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedLearner,
          sender_id: profile?.id,
          title: messageTitle,
          message: messageContent,
          type: 'info',
          message_type: 'admin_to_learner'
        });

      if (error) throw error;

      toast.success('Message sent successfully!');
      setMessageTitle('');
      setMessageContent('');
      setSelectedLearner('');
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      
      setInboxMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const unreadInboxCount = inboxMessages.filter(msg => !msg.read_at).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <Button
          variant={activeTab === 'send' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('send')}
          className="flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>Send Message</span>
        </Button>
        <Button
          variant={activeTab === 'inbox' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('inbox')}
          className="flex items-center space-x-2 relative"
        >
          <Inbox className="h-4 w-4" />
          <span>Inbox</span>
          {unreadInboxCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadInboxCount}
            </Badge>
          )}
        </Button>
      </div>

      {activeTab === 'send' ? (
        /* Send Message Tab */
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Send Message to Learners
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Learner Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Learner</label>
              <Select value={selectedLearner} onValueChange={setSelectedLearner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a learner to message..." />
                </SelectTrigger>
                <SelectContent>
                  {learners.map((learner) => (
                    <SelectItem key={learner.id} value={learner.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{learner.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {learner.employer_name} • {learner.learnership_program}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Input
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Enter message subject..."
                className="w-full"
              />
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-32 w-full"
                rows={6}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={sendMessage}
              disabled={loading || !selectedLearner || !messageTitle.trim() || !messageContent.trim()}
              className="w-full"
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
          </CardContent>
        </Card>
      ) : (
        /* Inbox Tab */
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Messages from Learners
              </span>
              {unreadInboxCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadInboxCount} unread
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {inboxMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                  <p className="text-gray-500">Messages from learners will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inboxMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        message.read_at
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200 shadow-sm'
                      }`}
                      onClick={() => !message.read_at && markMessageAsRead(message.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {message.user?.full_name}
                          </span>
                          {!message.read_at && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{message.title}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{message.message}</p>
                      <Separator className="my-2" />
                      <div className="text-xs text-gray-500">
                        From: {message.user?.full_name !== 'Unknown User' ? `${message.user?.full_name} (${message.user?.email})` : 'Unknown User'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Comms;