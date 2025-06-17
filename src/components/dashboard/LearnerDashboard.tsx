
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type FeedbackSubmission = Tables<'feedback_submissions'>;
type Achievement = Tables<'achievements'>;

const LearnerDashboard = () => {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      const [submissionsData, achievementsData] = await Promise.all([
        supabase
          .from('feedback_submissions')
          .select('*')
          .eq('learner_id', profile!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('achievements')
          .select('*')
          .eq('learner_id', profile!.id)
          .order('earned_at', { ascending: false })
      ]);

      if (submissionsData.data) setSubmissions(submissionsData.data);
      if (achievementsData.data) setAchievements(achievementsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceScore = () => {
    return profile?.compliance_score || 0;
  };

  const getPendingSubmissions = () => {
    return submissions.filter(s => s.status === 'pending').length;
  };

  const getOverdueSubmissions = () => {
    return submissions.filter(s => s.status === 'overdue').length;
  };

  const getRecentAchievements = () => {
    return achievements.slice(0, 3);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Compliance Score */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Compliance Score</p>
                <p className="text-3xl font-bold text-green-700">{getComplianceScore().toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <Progress value={getComplianceScore()} className="mt-3" />
          </CardContent>
        </Card>

        {/* Total Points */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold text-orange-700">{profile?.points || 0}</p>
              </div>
              <div className="h-12 w-12 bg-[#e16623] rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Pending Tasks</p>
                <p className="text-3xl font-bold text-blue-700">{getPendingSubmissions()}</p>
              </div>
              <div className="h-12 w-12 bg-[#122ec0] rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Items */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-700">{getOverdueSubmissions()}</p>
              </div>
              <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(submission.created_at!).toLocaleDateString('en-ZA', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(submission.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    submission.status === 'submitted' ? 'default' :
                    submission.status === 'approved' ? 'secondary' :
                    submission.status === 'overdue' ? 'destructive' : 'outline'
                  }>
                    {submission.status}
                  </Badge>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No submissions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentAchievements().map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                  <div className="h-10 w-10 bg-[#e16623] rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{achievement.badge_name}</p>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-[#e16623] font-medium">+{achievement.points_awarded} points</p>
                  </div>
                </div>
              ))}
              {achievements.length === 0 && (
                <p className="text-gray-500 text-center py-4">No achievements yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearnerDashboard;
