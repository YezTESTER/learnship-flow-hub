
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Award, Trophy, Star, Target, Zap, Calendar } from 'lucide-react';

interface Achievement {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string;
  points_awarded: number;
  earned_at: string;
}

const AchievementsDisplay = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data: achievementData, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('learner_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementError) throw achievementError;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setAchievements(achievementData || []);
      setTotalPoints(profileData?.points || 0);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'monthly_submission':
        return <Calendar className="h-5 w-5" />;
      case 'document_upload':
        return <Target className="h-5 w-5" />;
      case 'perfect_attendance':
        return <Star className="h-5 w-5" />;
      case 'early_submission':
        return <Zap className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'monthly_submission':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'document_upload':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'perfect_attendance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'early_submission':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <Card className="bg-gradient-to-br from-[#122ec0] to-blue-600 text-white border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="h-8 w-8 text-yellow-300" />
            <CardTitle className="text-3xl font-bold">
              {totalPoints}
            </CardTitle>
          </div>
          <CardDescription className="text-blue-100 text-lg">
            Total Points Earned
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Achievements List */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            Your Achievements
          </CardTitle>
          <CardDescription>
            Celebrate your learnership milestones and accomplishments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No achievements yet</p>
              <p className="text-gray-400">Complete monthly reports and upload documents to earn your first badge!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className={`p-3 rounded-full ${getBadgeColor(achievement.badge_type)}`}>
                    {getBadgeIcon(achievement.badge_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {achievement.badge_name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Earned on {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-[#e16623] text-white hover:bg-[#d55a1f]">
                    +{achievement.points_awarded} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementsDisplay;
