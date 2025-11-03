import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyComplianceData {
  id: string;
  month: number;
  year: number;
  feedback_score: number;
  timesheet_score: number;
  document_score: number;
  engagement_score: number;
  overall_compliance_percent: number;
  feedback_points: number;
  timesheet_points: number;
  document_points: number;
  engagement_points: number;
  total_monthly_points: number;
  created_at: string;
  updated_at: string;
}

interface UseMonthlyComplianceReturn {
  monthlyHistory: MonthlyComplianceData[];
  lifetimePoints: number;
  loading: boolean;
  refresh: () => Promise<void>;
  calculateCurrentMonth: () => Promise<void>;
}

export function useMonthlyCompliance(): UseMonthlyComplianceReturn {
  const { user } = useAuth();
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyComplianceData[]>([]);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const calculateCurrentMonth = useCallback(async () => {
    if (!user?.id) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    try {
      await (supabase as any).rpc('calculate_monthly_compliance_with_points', {
        user_id: user.id,
        target_month: currentMonth,
        target_year: currentYear
      });
    } catch (error) {
      console.error('Error calculating current month compliance:', error);
    }
  }, [user?.id]);

  const fetchMonthlyHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Calculate compliance for current month
      await calculateCurrentMonth();

      // Fetch last 3 months of compliance history
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
      
      const { data: historyData, error: historyError } = await (supabase as any)
        .from('monthly_compliance_history')
        .select('*')
        .eq('learner_id', user.id)
        .gte('year', threeMonthsAgo.getFullYear())
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(3);

      if (historyError) {
        console.error('Error fetching monthly history:', historyError);
        return;
      }

      setMonthlyHistory(historyData || []);

      // Calculate lifetime points from achievements table
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('points_awarded')
        .eq('learner_id', user.id);

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        return;
      }

      const totalLifetimePoints = achievementsData?.reduce((sum, achievement) => 
        sum + (achievement.points_awarded || 0), 0
      ) || 0;

      setLifetimePoints(totalLifetimePoints);

    } catch (error) {
      console.error('Error in fetchMonthlyHistory:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, calculateCurrentMonth]);

  useEffect(() => {
    fetchMonthlyHistory();
  }, [fetchMonthlyHistory]);

  return {
    monthlyHistory,
    lifetimePoints,
    loading,
    refresh: fetchMonthlyHistory,
    calculateCurrentMonth
  };
}
