import { supabase } from '@/integrations/supabase/client';

// This function should be run periodically (e.g., daily) to check for expired timesheets
export const checkAndMarkExpiredTimesheets = async () => {
  try {
    console.log('Checking for expired timesheets...');
    
    // Call the database function to mark expired timesheets
    const { data, error } = await (supabase as any).rpc('check_and_mark_expired_timesheets');
    
    if (error) {
      console.error('Error checking expired timesheets:', error);
      return { success: false, error };
    }
    
    console.log('Successfully checked for expired timesheets');
    return { success: true, data };
  } catch (error) {
    console.error('Exception in checkAndMarkExpiredTimesheets:', error);
    return { success: false, error };
  }
};

// This function should be run periodically (e.g., weekly) to delete expired files
export const deleteExpiredTimesheetFiles = async () => {
  try {
    console.log('Deleting expired timesheet files...');
    
    // Call the database function to delete expired files
    const { data, error } = await (supabase as any).rpc('delete_expired_timesheet_files');
    
    if (error) {
      console.error('Error deleting expired timesheet files:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully deleted ${data?.deleted_count || 0} expired timesheet files`);
    return { success: true, deletedCount: data?.deleted_count || 0 };
  } catch (error) {
    console.error('Exception in deleteExpiredTimesheetFiles:', error);
    return { success: false, error };
  }
};

// For testing purposes
if (require.main === module) {
  // Run the functions
  checkAndMarkExpiredTimesheets().then(result => {
    console.log('Check result:', result);
  });
  
  deleteExpiredTimesheetFiles().then(result => {
    console.log('Delete result:', result);
  });
}