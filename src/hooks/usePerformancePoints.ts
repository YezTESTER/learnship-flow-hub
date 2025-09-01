import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePerformancePoints() {
  const { user } = useAuth();
  const { toast } = useToast();

  const awardPoints = useCallback(async (
    actionType: string, 
    basePoints: number, 
    description: string
  ) => {
    if (!user?.id) return;

    try {
      // Get performance-adjusted points
      const { data: adjustedPoints, error: pointsError } = await supabase
        .rpc('award_performance_points', {
          user_id: user.id,
          action_type: actionType,
          base_points: basePoints
        });

      if (pointsError) {
        console.error('Error calculating performance points:', pointsError);
        // Fallback to base points
        await awardFallbackPoints(basePoints, description);
        return;
      }

      // Award the achievement
      const { error: achievementError } = await supabase
        .from('achievements')
        .insert({
          learner_id: user.id,
          badge_type: actionType,
          badge_name: description,
          description: `Performance-adjusted points: ${adjustedPoints}`,
          points_awarded: adjustedPoints,
          badge_color: getActionColor(actionType),
          badge_icon: getActionIcon(actionType)
        });

      if (achievementError) {
        console.error('Error creating achievement:', achievementError);
        return;
      }

      // Show toast with bonus/penalty information
      const multiplier = adjustedPoints / basePoints;
      let message = `+${adjustedPoints} points earned!`;
      
      if (multiplier > 1.1) {
        message += ` (${Math.round((multiplier - 1) * 100)}% performance bonus!)`;
      } else if (multiplier < 0.9) {
        message += ` (${Math.round((1 - multiplier) * 100)}% penalty for low compliance)`;
      }

      toast({
        title: "Points Awarded",
        description: message,
        duration: 5000,
      });

    } catch (error) {
      console.error('Error awarding performance points:', error);
      await awardFallbackPoints(basePoints, description);
    }
  }, [user?.id, toast]);

  const awardFallbackPoints = async (points: number, description: string) => {
    if (!user?.id) return;

    await supabase
      .from('achievements')
      .insert({
        learner_id: user.id,
        badge_type: 'activity',
        badge_name: description,
        description: 'Base points awarded',
        points_awarded: points,
        badge_color: '#3B82F6',
        badge_icon: 'award'
      });

    toast({
      title: "Points Awarded",
      description: `+${points} points earned!`,
    });
  };

  const getActionColor = (actionType: string): string => {
    const colors: Record<string, string> = {
      'feedback_submission': '#10B981',
      'document_upload': '#3B82F6',
      'timesheet_upload': '#8B5CF6',
      'profile_completion': '#F59E0B',
      'communication': '#EF4444'
    };
    return colors[actionType] || '#6B7280';
  };

  const getActionIcon = (actionType: string): string => {
    const icons: Record<string, string> = {
      'feedback_submission': 'clipboard-check',
      'document_upload': 'file-text',
      'timesheet_upload': 'clock',
      'profile_completion': 'user',
      'communication': 'message-circle'
    };
    return icons[actionType] || 'award';
  };

  return { awardPoints };
}