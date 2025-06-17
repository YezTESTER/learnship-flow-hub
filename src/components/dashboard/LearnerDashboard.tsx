
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  FileText, 
  Upload, 
  Award, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react';

const LearnerDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalDocuments: 0,
    totalAchievements: 0,
    complianceScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch submission stats
      const { data: submissions, error: submissionError } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('learner_id', user.id);

      if (submissionError) throw submissionError;

      // Fetch document count
      const { data: documents, error: documentError } = await supabase
        .from('documents')
        .select('id')
        .eq('learner_id', user.id);

      if (documentError) throw documentError;

      // Fetch achievement count
      const { data: achievements, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('learner_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(5);

      if (achievementError) throw achievementError;

      setStats({
        totalSubmissions: submissions?.length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === 'pending').length || 0,
        totalDocuments: documents?.length || 0,
        totalAchievements: achievements?.length || 0,
        complianceScore: profile?.compliance_score || 0
      });

      setRecentActivity(achievements || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const daysUntilDeadline = Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Points</p>
                <p className="text-3xl font-bold">{profile?.points || 0}</p>
              </div>
              <Award className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Compliance</p>
                <p className="text-3xl font-bold">{stats.complianceScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Documents</p>
                <p className="text-3xl font-bold">{stats.totalDocuments}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Submissions</p>
                <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report Reminder */}
      <Card className="bg-gradient-to-r from-[#122ec0] to-blue-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{currentMonth} Monthly Report</h3>
                <p className="text-blue-100">
                  {daysUntilDeadline > 0 
                    ? `Due in ${daysUntilDeadline} days (5th of the month)`
                    : 'Overdue - Submit immediately'}
                </p>
              </div>
            </div>
            <Button 
              className="bg-white text-[#122ec0] hover:bg-gray-100 rounded-xl font-semibold"
              onClick={() => window.location.hash = '#feedback'}
            >
              {daysUntilDeadline > 0 ? 'Submit Report' : 'Submit Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-[#122ec0]" />
              <span>Progress Overview</span>
            </CardTitle>
            <CardDescription>Your learnership journey so far</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Compliance Score</span>
                <span>{stats.complianceScore}%</span>
              </div>
              <Progress value={stats.complianceScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Reports</span>
                <span>{stats.totalSubmissions}/12</span>
              </div>
              <Progress value={(stats.totalSubmissions / 12) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Documents Uploaded</span>
                <span>{stats.totalDocuments}</span>
              </div>
              <Progress value={Math.min(stats.totalDocuments * 10, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-[#122ec0]" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>Your latest milestones and badges</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No achievements yet</p>
                <p className="text-sm text-gray-400">Complete tasks to earn your first badge!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {achievement.badge_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        +{achievement.points_awarded} points
                      </p>
                    </div>
                    <Badge className="bg-[#e16623] text-white text-xs">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-16 rounded-xl border-2 hover:border-[#122ec0] hover:bg-blue-50 transition-all duration-200"
              onClick={() => setActiveSection('feedback')}
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-[#122ec0]" />
                <span className="text-sm font-medium">Monthly Report</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 rounded-xl border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
              onClick={() => setActiveSection('documents')}
            >
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <span className="text-sm font-medium">Upload Documents</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 rounded-xl border-2 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
              onClick={() => setActiveSection('achievements')}
            >
              <div className="text-center">
                <Award className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                <span className="text-sm font-medium">View Achievements</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 rounded-xl border-2 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
              onClick={() => setActiveSection('profile')}
            >
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <span className="text-sm font-medium">Profile Settings</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerDashboard;
