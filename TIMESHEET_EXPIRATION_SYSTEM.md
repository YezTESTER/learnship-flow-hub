# Timesheet Expiration Management System

## Overview
This document describes the automated timesheet expiration management system that automatically handles the lifecycle of bi-weekly timesheet submissions. The system ensures that timesheet files are retained for only 2 months after upload, helping to manage storage costs while allowing sufficient time for administrative review.

## System Features

### 1. Automatic Expiration Date Setting
- When a learner uploads a timesheet, the system automatically sets an expiration date 2 months from the upload date
- This is handled by a database trigger that runs on timesheet submission

### 2. Admin Download Tracking
- Each time an admin views or downloads a timesheet, the download count is incremented
- This ensures that admins have accessed the timesheet before it expires

### 3. Automatic Expiration Checking
- A background job runs daily to check for timesheets that have passed their expiration date
- Expired timesheets are marked with an `is_expired` flag

### 4. File Deletion
- A weekly background job deletes expired timesheet files from storage
- Database records are retained but file paths are removed

### 5. UI Indicators
- Both admin and learner interfaces show clear indicators for expired timesheets
- Expired timesheets appear in the UI but cannot be viewed or downloaded
- Special styling indicates expired status

## Database Schema Changes

### New Columns in `timesheet_submissions` Table
1. `expiration_date` (TIMESTAMP WITH TIME ZONE) - When the timesheet expires
2. `download_count` (INTEGER) - Number of times admin has accessed the timesheet
3. `is_expired` (BOOLEAN) - Flag indicating if the timesheet has expired

### New Database Functions
1. `set_timesheet_expiration()` - Sets expiration date on submission
2. `increment_timesheet_download(schedule_id)` - Increments download count
3. `check_and_mark_expired_timesheets()` - Marks expired timesheets
4. `delete_expired_timesheet_files()` - Deletes expired files from storage

## Workflow

### Timesheet Upload
1. Learner uploads timesheet
2. System sets expiration date to 2 months from upload date
3. Timesheet is available for viewing/download

### Admin Access
1. Admin views/downloads timesheet
2. Download count is incremented
3. Timesheet remains available until expiration date

### Expiration Process
1. Daily job checks for expired timesheets
2. Expired timesheets are marked with `is_expired = true`
3. Weekly job deletes actual files from storage
4. Database records remain but file paths are cleared

### UI Behavior
1. Expired timesheets show "Expired" status
2. View/Download buttons are disabled
3. Special styling indicates expired status
4. Export functions include expiration information

## Implementation Details

### Frontend Changes
- **Admin Timesheets Page**: Added expired status filtering and UI indicators
- **Learner Document Upload Page**: Added expired status display and disabled actions

### Backend Changes
- **Database Migrations**: Added new columns and functions
- **Storage Policies**: Updated to handle expired file deletion
- **Background Jobs**: Created scripts for periodic expiration checking

### Security Considerations
- Only admins can increment download counts
- Row Level Security policies ensure proper access control
- Expired files are not accessible through normal UI flows

## User Experience

### For Admins
- Clear "Expired" badge on expired timesheets
- Disabled view/download buttons for expired timesheets
- Filter option to show only expired timesheets
- Export includes expiration date and download count

### For Learners
- Clear "Expired" badge on expired timesheets
- Disabled "View" and "Update" buttons for expired timesheets
- Expiration date displayed in timesheet cards
- Cannot access expired timesheet files

## Benefits

### Storage Management
- Automatic cleanup of old timesheet files
- Predictable storage usage patterns
- Reduced long-term storage costs

### Compliance
- Ensures timesheets are available for review period
- Maintains audit trail with database records
- Clear policy for data retention

### User Experience
- Transparent expiration process
- Clear indicators of timesheet status
- No unexpected loss of accessible timesheets

## Configuration

### Background Job Scheduling
- Daily: `check_and_mark_expired_timesheets()`
- Weekly: `delete_expired_timesheet_files()`

### Customization
- Expiration period can be adjusted by modifying the trigger function
- Download tracking can be enhanced for more detailed analytics

## Troubleshooting

### Common Issues
1. **Timesheets not expiring**: Check if background jobs are running
2. **Files not deleting**: Verify storage permissions and job execution
3. **UI not showing expired status**: Refresh data or check database flags

### Monitoring
- Check job execution logs
- Monitor database for proper flag setting
- Verify storage usage trends

## Future Enhancements
1. Email notifications before expiration
2. Configurable expiration periods by learner category
3. Detailed analytics on timesheet access patterns
4. Manual override for special circumstances