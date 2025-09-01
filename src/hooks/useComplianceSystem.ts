import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceFactors {
  feedback_score: number;
  timesheet_score: number;
  document_score: number;
  engagement_score: number;
  overall_score: number;
}

interface TimesheetPeriod {
  id: string;
  period: number;
  work_timesheet_uploaded: boolean;
  class_timesheet_uploaded: boolean;
  due_date: string;
  uploaded_at: string | null;
}

interface ComplianceBreakdown extends ComplianceFactors {
  next_actions: string[];
  status_message: string;
  trend: 'improving' | 'stable' | 'declining';
}

export function useComplianceSystem() {
  const { user, profile } = useAuth();
  const [compliance, setCompliance] = useState<ComplianceBreakdown | null>(null);
  const [timesheetPeriods, setTimesheetPeriods] = useState<TimesheetPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplianceData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Update compliance score first
      await supabase.rpc('update_compliance_score', { user_id: user.id });

      // Fetch compliance factors
      const { data: complianceData, error: complianceError } = await supabase
        .from('compliance_factors')
        .select('*')
        .eq('learner_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      // Fetch timesheet periods
      const { data: timesheetData, error: timesheetError } = await supabase
        .from('timesheet_schedules')
        .select('*')
        .eq('learner_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('period');

      if (complianceError && complianceError.code !== 'PGRST116') {
        console.error('Compliance fetch error:', complianceError);
        return;
      }

      if (timesheetError) {
        console.error('Timesheet fetch error:', timesheetError);
        return;
      }

      setTimesheetPeriods(timesheetData || []);

      // Generate compliance breakdown
      const factors = complianceData || {
        feedback_score: 0,
        timesheet_score: 0,
        document_score: 0,
        engagement_score: 0,
        overall_score: 0
      };

      const nextActions: string[] = [];
      
      if (factors.feedback_score < 100) {
        nextActions.push('Submit monthly feedback');
      }
      if (factors.timesheet_score < 100) {
        const incompletePeriodsCount = (timesheetData || []).filter(p => 
          !p.work_timesheet_uploaded || !p.class_timesheet_uploaded
        ).length;
        if (incompletePeriodsCount > 0) {
          nextActions.push(`Upload ${incompletePeriodsCount} bi-weekly timesheet${incompletePeriodsCount > 1 ? 's' : ''}`);
        }
      }
      if (factors.document_score < 100) {
        nextActions.push('Upload missing required documents');
      }
      if (factors.engagement_score < 80) {
        nextActions.push('Complete profile and earn achievements');
      }

      let statusMessage = 'Excellent compliance!';
      if (factors.overall_score < 60) {
        statusMessage = 'Immediate attention required';
      } else if (factors.overall_score < 80) {
        statusMessage = 'Good progress, room for improvement';
      }

      setCompliance({
        ...factors,
        next_actions: nextActions,
        status_message: statusMessage,
        trend: 'stable' // TODO: Calculate trend from historical data
      });

    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateTimesheetUpload = useCallback(async (period: number, type: 'work' | 'class') => {
    if (!user?.id) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const updateField = type === 'work' ? 'work_timesheet_uploaded' : 'class_timesheet_uploaded';

    const { error } = await supabase
      .from('timesheet_schedules')
      .update({ 
        [updateField]: true,
        uploaded_at: new Date().toISOString()
      })
      .eq('learner_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('period', period);

    if (error) {
      console.error('Error updating timesheet:', error);
      return;
    }

    // Refresh compliance data
    await fetchComplianceData();
  }, [user?.id, fetchComplianceData]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  return {
    compliance,
    timesheetPeriods,
    loading,
    refresh: fetchComplianceData,
    updateTimesheetUpload
  };
}