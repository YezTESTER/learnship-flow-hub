import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TestTimesheets: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const results: any = {
        timestamp: new Date().toISOString(),
        steps: []
      };

      // Step 1: Fetch learners
      results.steps.push('Fetching learners...');
      const { data: learners, error: learnersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'learner')
        .order('full_name')
        .limit(5);

      if (learnersError) {
        results.steps.push(`Error fetching learners: ${learnersError.message}`);
        setTestResults(results);
        return;
      }

      results.steps.push(`Found ${learners?.length || 0} learners`);
      results.learners = learners;

      // Step 2: Fetch current year schedules
      if (learners && learners.length > 0) {
        const currentYear = new Date().getFullYear();
        results.steps.push(`Fetching schedules for year ${currentYear}...`);
        
        const { data: schedules, error: schedulesError } = await supabase
          .from('timesheet_schedules')
          .select('*')
          .in('learner_id', learners.map(l => l.id))
          .eq('year', currentYear)
          .order('month', { ascending: false })
          .order('period', { ascending: false })
          .limit(10);

        if (schedulesError) {
          results.steps.push(`Error fetching schedules: ${schedulesError.message}`);
          setTestResults(results);
          return;
        }

        results.steps.push(`Found ${schedules?.length || 0} schedules`);
        results.schedules = schedules;

        // Step 3: Fetch submissions
        if (schedules && schedules.length > 0) {
          const scheduleIds = schedules.map(s => s.id);
          results.steps.push(`Fetching submissions for ${scheduleIds.length} schedules...`);
          
          const { data: submissions, error: submissionsError }: any = await (supabase as any)
            .from('timesheet_submissions')
            .select('*')
            .in('schedule_id', scheduleIds);

          if (submissionsError) {
            results.steps.push(`Error fetching submissions: ${submissionsError.message}`);
            setTestResults(results);
            return;
          }

          results.steps.push(`Found ${submissions?.length || 0} submissions`);
          results.submissions = submissions;
        }
      }

      setTestResults(results);
    } catch (error: any) {
      setTestResults({
        timestamp: new Date().toISOString(),
        steps: [`Test failed with error: ${error.message}`],
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Timesheet Data Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTest} disabled={loading}>
          {loading ? 'Testing...' : 'Run Test'}
        </Button>
        
        {testResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-2">Test Results ({testResults.timestamp})</h3>
            <div className="space-y-2">
              {testResults.steps.map((step: string, index: number) => (
                <div key={index} className="text-sm">{step}</div>
              ))}
            </div>
            
            {testResults.learners && (
              <div className="mt-4">
                <h4 className="font-semibold">Learners:</h4>
                <ul className="list-disc pl-5">
                  {testResults.learners.map((learner: any) => (
                    <li key={learner.id}>{learner.full_name} ({learner.email})</li>
                  ))}
                </ul>
              </div>
            )}
            
            {testResults.schedules && (
              <div className="mt-4">
                <h4 className="font-semibold">Schedules:</h4>
                <ul className="list-disc pl-5">
                  {testResults.schedules.map((schedule: any) => (
                    <li key={schedule.id}>
                      Learner: {schedule.learner_id}, 
                      Month: {schedule.month}/{schedule.year}, 
                      Period: {schedule.period}, 
                      Uploaded: {schedule.work_timesheet_uploaded ? 'Yes' : 'No'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {testResults.submissions && (
              <div className="mt-4">
                <h4 className="font-semibold">Submissions:</h4>
                <ul className="list-disc pl-5">
                  {testResults.submissions.map((submission: any) => (
                    <li key={submission.id}>
                      Schedule: {submission.schedule_id}, 
                      File: {submission.file_name}, 
                      Absent days: {submission.absent_days}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};