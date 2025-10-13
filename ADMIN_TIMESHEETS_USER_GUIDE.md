# Admin Timesheets User Guide

## Introduction
This guide explains how to use the enhanced Admin Timesheets page to efficiently manage large volumes of learner timesheet submissions.

## Accessing the Admin Timesheets Page
1. Log in to the application with admin credentials
2. Navigate to the "Timesheets" menu item in the admin sidebar
3. The enhanced Admin Timesheets dashboard will load

## Dashboard Overview

### Summary Statistics Cards
At the top of the page, you'll see 5 summary cards:
- **Total**: Overall count of timesheet records
- **Submitted**: Count of submitted timesheets
- **Pending**: Count of pending timesheets
- **Overdue**: Count of overdue timesheets
- **Perfect Attendance**: Count of timesheets with 0 absent days

## Filtering Data

### Search Function
Use the search box at the top to find specific learners by:
- Full name
- Email address

### Filter Options
Use the dropdown filters to narrow down your view:

1. **Year Filter**
   - Shows timesheets for a specific year
   - Defaults to current year
   - Options include current year and previous 2 years

2. **Month Filter**
   - Shows timesheets for a specific month
   - "All Months" shows data for the entire year
   - Individual months show only that month's data

3. **Status Filter**
   - "All Statuses" shows everything
   - "Submitted" shows only completed timesheets
   - "Pending" shows timesheets due in the future with no submission
   - "Overdue" shows timesheets past due with no submission

4. **Absent Days Filter**
   - "All Absent Days" shows everything
   - "Perfect Attendance" shows timesheets with 0 absent days
   - "1+ Absent Days" shows timesheets with 1 or more absent days
   - "No Record" shows timesheets with no absent day information

## Sorting Data

Use the "Sort By" dropdown to change how records are ordered:

- **Due Date (Newest)**: Most recent due dates first
- **Due Date (Oldest)**: Oldest due dates first
- **Learner (A-Z)**: Alphabetical by learner name
- **Learner (Z-A)**: Reverse alphabetical by learner name
- **Status (Pending first)**: Pending records before submitted
- **Status (Submitted first)**: Submitted records before pending
- **Absent Days (Lowest)**: Fewer absent days first
- **Absent Days (Highest)**: More absent days first

## Selecting and Managing Records

### Individual Selection
1. Click the checkbox next to any timesheet record to select it
2. Selected records will have a light blue background

### Bulk Selection
1. Click the checkbox in the table header to select all visible records
2. All checkboxes will be checked and records highlighted
3. Click again to deselect all

### Clearing Selection
1. When records are selected, a "Clear" button (X) appears
2. Click this button to deselect all records

## Exporting Data

### Export All Records
1. Click the "Export All" button at the top right of the table
2. A CSV file will download with all visible records

### Export Selected Records
1. Select one or more records using checkboxes
2. Click the "Export Selected" button that appears when records are selected
3. A CSV file will download with only the selected records

The exported CSV includes:
- Learner Name
- Email
- Month
- Year
- Period
- Due Date
- Submitted Date (if applicable)
- Status
- Absent Days (if recorded)

## Viewing Individual Timesheets

### View Timesheet
1. Find the timesheet record you want to view
2. Click the "Eye" icon in the Actions column
3. The timesheet document will open in a new browser tab

### Download Timesheet
1. Find the timesheet record you want to download
2. Click the "Download" icon in the Actions column
3. The timesheet document will download to your computer

## Refreshing Data

Click the "Refresh" button at the top right to:
- Reload all timesheet data from the database
- Clear any temporary filtering or sorting
- Update statistics with the latest information

## View Modes

Toggle between List View and Grid View using the view mode button at the top right:
- **List View**: Traditional table layout (default)
- **Grid View**: Card-based layout (coming in future update)

## Best Practices

### Managing Large Datasets
1. Use filters to narrow down to relevant records
2. Sort by due date to focus on urgent items
3. Use bulk selection and export for reporting needs
4. Regularly refresh data to see latest submissions

### Monitoring Compliance
1. Check the Overdue summary card for at-risk submissions
2. Use the Status filter to focus on pending items
3. Monitor Perfect Attendance count for positive trends
4. Export data periodically for historical analysis

### Finding Specific Records
1. Use search for known learners
2. Combine filters for precise results (e.g., "Overdue" + specific month)
3. Sort by learner name for alphabetical browsing
4. Use absent days filter to identify attendance patterns

## Troubleshooting

### No Data Showing
1. Check that filters aren't too restrictive
2. Try "All" options for status and absent days filters
3. Click Refresh to reload data
4. Verify you're viewing the correct year

### Export Not Working
1. Ensure you have selected records for "Export Selected"
2. Check that your browser allows downloads
3. Look for browser notifications blocking the download

### Performance Issues
1. Apply more filters to reduce visible records
2. Use specific months rather than "All Months"
3. Clear selections when not needed
4. Refresh the page to clear memory

## Support

For issues not covered in this guide:
1. Check the browser console for error messages
2. Refresh the page to clear temporary issues
3. Contact technical support with specific error details