-- Notifications soft-delete + performance indexes
-- 1) Add soft-delete column so users "dismiss" instead of hard-deleting
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2) Partial index for fast queries of active (not dismissed) notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_active_user_read_created
  ON public.notifications (user_id, read_at, created_at)
  WHERE deleted_at IS NULL;

-- 3) Optional lightweight index to speed up count of unread per user
CREATE INDEX IF NOT EXISTS idx_notifications_active_unread_user
  ON public.notifications (user_id)
  WHERE deleted_at IS NULL AND read_at IS NULL;
