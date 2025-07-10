import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText, Award, Bell, Settings, TrendingUp, Clock, CheckCircle, Target, Star, Upload, AlertCircle, User } from 'lucide-react';
interface LearnerDashboardProps {
  setActiveSection?: (section: string) => void;
}
const LearnerDashboard: React.FC<LearnerDashboardProps> = ({
  setActiveSection
}) => {
  const {
    profile
  } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    completedSubmissions: 0,
    overdueSubmissions: 0,
    nextDueDate: null as string | null,
    uploadedDocuments: 0
  });
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchDashboardData();
    calculateProfileCompletion();
  }, [profile]);
  const calculateProfileCompletion = () => {
    if (!profile) return;
    const requiredFields = ['full_name', 'id_number', 'learnership_program', 'employer_name', 'phone_number', 'address', 'date_of_birth', 'emergency_contact', 'emergency_phone', 'start_date', 'end_date'];
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && value.toString().trim() !== '';
    }).length;
    const completion = Math.round(completedFields / requiredFields.length * 100);
    setProfileCompletion(completion);
  };
  const fetchDashboardData = async () => {
    if (!profile) return;
    try {
      // Fetch submission statistics
      const {
        data: submissions
      } = await supabase.from('feedback_submissions').select('*').eq('learner_id', profile.id);

      // Fetch documents count
      const {
        data: documents
      } = await supabase.from('documents').select('id').eq('learner_id', profile.id);

      // Fetch recent achievements
      const {
        data: achievements
      } = await supabase.from('achievements').select('*').eq('learner_id', profile.id).order('earned_at', {
        ascending: false
      }).limit(3);
      if (submissions) {
        const completed = submissions.filter(s => s.status === 'submitted' || s.status === 'approved').length;
        const overdue = submissions.filter(s => s.status === 'overdue').length;

        // Find next due submission
        const pendingSubmissions = submissions.filter(s => s.status === 'pending');
        const nextDue = pendingSubmissions.length > 0 ? pendingSubmissions.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] : null;
        setStats({
          totalSubmissions: submissions.length,
          completedSubmissions: completed,
          overdueSubmissions: overdue,
          nextDueDate: nextDue?.due_date || null,
          uploadedDocuments: documents?.length || 0
        });
      }
      if (achievements) {
        setRecentAchievements(achievements);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fix compliance calculation - should be based on actual performance, not just existence
  const compliancePercentage = stats.totalSubmissions > 0 ? Math.round(stats.completedSubmissions / stats.totalSubmissions * 100) : 0; // Changed from 100 to 0 when no submissions exist

  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#122ec0]"></div>
      </div>;
  }
  const handleNavigateToSection = (section: string) => {
    if (setActiveSection) {
      setActiveSection(section);
    }
  };
  return <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#122ec0] to-blue-400 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h2>
            <p className="text-blue-100 mt-1">Keep up the great work on your learnership journey</p>
          </div>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {profileCompletion < 100 && <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Complete Your Profile</h3>
                <p className="text-yellow-700 text-sm">Your profile is {profileCompletion}% complete. Complete it to unlock all features.</p>
                <div className="mt-2">
                  <Progress value={profileCompletion} className="h-2" />
                </div>
              </div>
              <Button onClick={() => handleNavigateToSection('profile')} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Compliance Score</p>
                <p className="text-2xl font-bold text-green-900">{compliancePercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Star className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Points Earned</p>
                <p className="text-2xl font-bold text-blue-900">{profile?.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">Submissions</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completedSubmissions}/{stats.totalSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.overdueSubmissions > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className={`h-8 w-8 ${stats.overdueSubmissions > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              <div>
                <p className={`text-sm font-medium ${stats.overdueSubmissions > 0 ? 'text-red-800' : 'text-gray-800'}`}>Overdue</p>
                <p className={`text-2xl font-bold ${stats.overdueSubmissions > 0 ? 'text-red-900' : 'text-gray-900'}`}>{stats.overdueSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Overview */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-indigo-800">Documents Uploaded</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.uploadedDocuments}</p>
              </div>
            </div>
            <Button onClick={() => handleNavigateToSection('documents')} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 text-xs">
              View Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-[#122ec0]" />
              <span>Compliance Progress</span>
            </CardTitle>
            <CardDescription>Your overall performance this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Compliance</span>
                <span className="font-semibold">{compliancePercentage}%</span>
              </div>
              <Progress value={compliancePercentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.completedSubmissions}</p>
                <p className="text-sm text-green-800">Completed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.overdueSubmissions}</p>
                <p className="text-sm text-red-800">Overdue</p>
              </div>
            </div>

            {stats.nextDueDate && <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Next Due Date</p>
                <p className="text-blue-700">{new Date(stats.nextDueDate).toLocaleDateString()}</p>
              </div>}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-[#e16623]" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>Your latest badges and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAchievements.length > 0 ? <div className="space-y-3">
                {recentAchievements.map((achievement: any) => <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#122ec0]/10 to-[#e16623]/10 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#122ec0] to-[#e16623] flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{achievement.badge_name}</p>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                    </div>
                    <Badge variant="secondary">+{achievement.points_awarded}</Badge>
                  </div>)}
              </div> : <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No achievements yet</p>
                <p className="text-sm">Complete your first feedback to earn badges!</p>
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#122ec0]" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>Complete your monthly tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={() => handleNavigateToSection('feedback')} className="h-20 bg-gradient-to-r from-[#122ec0] to-blue-500 hover:from-[#0f2499] hover:to-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Submit Feedback</span>
              </div>
            </Button>

            <Button onClick={() => handleNavigateToSection('documents')} variant="outline" className="h-20 border-2 border-[#e16623] text-[#e16623] hover:bg-[#e16623] hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Upload Documents</span>
              </div>
            </Button>

            <Button onClick={() => handleNavigateToSection('achievements')} variant="outline" className="h-20 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <Award className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">View Achievements</span>
              </div>
            </Button>

            <Button onClick={() => handleNavigateToSection('profile')} variant="outline" className="h-20 border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Profile Settings</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default LearnerDashboard;