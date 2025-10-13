import { supabase } from '@/integrations/supabase/client';

export const testTimesheetData = async () => {
  try {
    console.log('=== Testing Timesheet Data ===');
    
    // Get current year
    const currentYear = new Date().getFullYear();
    console.log('Current year:', currentYear);
    
    // Fetch learners
    const { data: learners, error: learnersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'learner')
      .order('full_name');
    
    if (learnersError) {
      console.error('Error fetching learners:', learnersError);
      return;
    }
    
    console.log('Found learners:', learners?.length || 0);
    if (learners && learners.length > 0) {
      console.log('First 3 learners:', learners.slice(0, 3));
    }
    
    // Fetch schedules for current year
    if (learners && learners.length > 0) {
      const { data: schedules, error: schedulesError } = await supabase
        .from('timesheet_schedules')
        .select(`
          id,
          learner_id,
          month,
          year,
          period,
          due_date,
          work_timesheet_uploaded,
          uploaded_at
        `)
        .in('learner_id', learners.map(l => l.id))
        .eq('year', currentYear)
        .order('month', { ascending: false })
        .order('period', { ascending: false })
        .limit(10);
      
      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        return;
      }
      
      console.log('Found schedules:', schedules?.length || 0);
      if (schedules && schedules.length > 0) {
        console.log('First 3 schedules:', schedules.slice(0, 3));
        
        // Fetch submissions for these schedules
        const scheduleIds = schedules.map(s => s.id);
        const { data: submissions, error: submissionsError }: any = await (supabase as any)
          .from('timesheet_submissions')
          .select('*')
          .in('schedule_id', scheduleIds);
        
        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }
        
        console.log('Found submissions:', submissions?.length || 0);
        if (submissions && submissions.length > 0) {
          console.log('First 3 submissions:', submissions.slice(0, 3));
        }
      }
    }
    
    console.log('=== Test Complete ===');
  } catch (error) {
    console.error('Test error:', error);
  }
};