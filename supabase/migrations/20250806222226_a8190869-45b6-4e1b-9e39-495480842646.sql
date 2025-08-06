-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create some test notifications for admin users to verify the system is working
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the first admin user
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Create test notifications
    INSERT INTO public.notifications (user_id, title, message, type, message_type) VALUES
    (admin_id, 'System Test', 'This is a test notification to verify the notification system is working', 'info', 'system'),
    (admin_id, 'Welcome to Admin Dashboard', 'Your admin notification system is now active', 'success', 'system');
  END IF;
END $$;