# Timesheet Expiration System Deployment Guide

## Overview
This guide explains how to deploy the timesheet expiration management system to your Supabase project. The system automatically manages the lifecycle of bi-weekly timesheet submissions, retaining files for 2 months after upload.

## Prerequisites
1. Supabase CLI installed
2. Docker Desktop installed (for local development)
3. Access to your Supabase project
4. Supabase project linked to your local environment

## Deployment Steps

### 1. Database Migration
The database changes need to be applied to your Supabase project:

1. Navigate to your project directory:
   ```bash
   cd /path/to/learnship-flow-hub
   ```

2. Link your Supabase project (if not already linked):
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

3. Apply the database migration:
   ```bash
   npx supabase migration up
   ```

   This will apply the migration file: `supabase/migrations/20251013150000_timesheet_expiration_management.sql`

### 2. Frontend Deployment
The frontend changes are in the React components and will be deployed with your normal build process:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy using your preferred method (Vercel, Netlify, etc.)

### 3. Background Job Setup
The expiration system requires two background jobs to be scheduled:

#### Daily Job: Check and Mark Expired Timesheets
This job should run daily to check for timesheets that have passed their expiration date:

```sql
SELECT public.check_and_mark_expired_timesheets();
```

#### Weekly Job: Delete Expired Files
This job should run weekly to delete expired files from storage:

```sql
SELECT public.delete_expired_timesheet_files();
```

## Setting Up Background Jobs

### Option 1: Supabase Cron Jobs (Recommended)
If your Supabase project supports cron jobs, you can set them up in the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Database" → "SQL Editor"
3. Run the following SQL to create cron jobs:

```sql
-- Daily job to check for expired timesheets
SELECT cron.schedule(
    'check-expired-timesheets',
    '0 0 * * *',  -- Run daily at midnight
    $$SELECT public.check_and_mark_expired_timesheets()$$
);

-- Weekly job to delete expired files
SELECT cron.schedule(
    'delete-expired-timesheet-files',
    '0 1 * * 0',  -- Run weekly on Sunday at 1 AM
    $$SELECT public.delete_expired_timesheet_files()$$
);
```

### Option 2: External Scheduler
If cron jobs are not available, you can set up external scheduling using:

1. **GitHub Actions** - Schedule workflows to run the database functions
2. **Cloud Scheduler** (Google Cloud, AWS, etc.) - HTTP calls to Supabase functions
3. **Self-hosted cron jobs** - Run scripts on your own servers

Example GitHub Actions workflow:

```yaml
name: Timesheet Expiration Management

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:

jobs:
  check-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Check expired timesheets
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"query": "SELECT public.check_and_mark_expired_timesheets();"}' \
            https://your-project-ref.supabase.co/rest/v1/rpc/check_and_mark_expired_timesheets
```

## Testing the Deployment

### 1. Verify Database Changes
After applying the migration, verify the new columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'timesheet_submissions' 
AND column_name IN ('expiration_date', 'download_count', 'is_expired');
```

### 2. Test the Functions
Verify the database functions work correctly:

```sql
-- Test the expiration setting function
SELECT public.set_timesheet_expiration();

-- Test the download increment function
SELECT public.increment_timesheet_download('test-schedule-id');

-- Test the expiration checking function
SELECT public.check_and_mark_expired_timesheets();

-- Test the file deletion function
SELECT public.delete_expired_timesheet_files();
```

### 3. UI Testing
1. Upload a new timesheet and verify the expiration date is set
2. Access the timesheet as admin and verify download count increments
3. Manually mark a timesheet as expired and verify UI changes
4. Attempt to access an expired timesheet and verify it's blocked

## Monitoring and Maintenance

### Monitoring
1. Check job execution logs regularly
2. Monitor database for proper flag setting
3. Verify storage usage trends

### Troubleshooting
1. **Jobs not running**: Check cron job configuration or external scheduler
2. **Files not deleting**: Verify storage permissions and job execution
3. **UI not showing expired status**: Refresh data or check database flags

### Rollback Plan
If issues occur, you can rollback the changes:

1. Remove the background jobs
2. Revert the database migration:
   ```bash
   npx supabase migration down
   ```
3. Deploy the previous version of the frontend

## Customization Options

### Adjusting Expiration Period
To change the expiration period from 2 months, modify the `set_timesheet_expiration` function:

```sql
-- Change this line in the function:
NEW.expiration_date := NEW.uploaded_at + INTERVAL '2 months';

-- To something like:
NEW.expiration_date := NEW.uploaded_at + INTERVAL '3 months';
```

### Adding Notifications
You can enhance the system by adding email notifications before expiration:

1. Create a function to identify timesheets expiring soon
2. Integrate with Supabase Email or external email service
3. Schedule a job to send notifications

## Support
For issues with the deployment, check:
1. Supabase project logs
2. Database function execution logs
3. Frontend console errors
4. Network connectivity issues