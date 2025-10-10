import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useComplianceSystem, TimesheetPeriod } from '@/hooks/useComplianceSystem';
import { Calendar, FileText, Award, Bell, Settings, TrendingUp, Clock, CheckCircle, Target, Star, Upload, AlertCircle, User, BarChart3, Zap } from 'lucide-react';

interface LearnerDashboardProps {
  setActiveSection?: (section: string) => void;
}

const LearnerDashboard: React.FC<LearnerDashboardProps> = ({
  setActiveSection
}) => {
  const { user, profile } = useAuth();
  const { compliance, timesheetPeriods, loading: complianceLoading } = useComplianceSystem();
  
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
  const [hasCurrentMonthFeedback, setHasCurrentMonthFeedback] = useState(false);
  const [missingRequiredDocs, setMissingRequiredDocs] = useState<string[]>([]);
  const [pastTimesheets, setPastTimesheets] = useState<TimesheetPeriod[]>([]);

  useEffect(() => {
    fetchDashboardData();
    calculateProfileCompletion();
    fetchPastTimesheets();
  }, [profile]);

  const fetchPastTimesheets = async () => {
    if (!user?.id) return;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
    threeMonthsAgo.setDate(1);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('timesheet_schedules')
      .select('*')
      .eq('learner_id', user.id)
      .gte('due_date', threeMonthsAgo.toISOString())
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (data) setPastTimesheets(data);
  };

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
      const { data: submissions } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('learner_id', profile.id);

      // Fetch documents
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('learner_id', profile.id);

      // Fetch recent achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('learner_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      if (submissions) {
        const completed = submissions.filter(s => s.status === 'submitted' || s.status === 'approved').length;
        const overdue = submissions.filter(s => s.status === 'overdue').length;

        // Current period
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        const current = submissions.find(s => s.month === currMonth && s.year === currYear && (s.status === 'submitted' || s.status === 'approved'));
        setHasCurrentMonthFeedback(!!current);

        // Check required documents compliance
        const requiredDocs = ['certified_id', 'cv_upload', 'proof_bank_account'] as const;
        const uploadedDocTypes = documents?.map(doc => doc.document_type) || [];
        const missing = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType as any));
        setMissingRequiredDocs(missing);

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

  const timesheetsByMonth = useMemo(() => {
    const grouped: { [key: string]: TimesheetPeriod[] } = {};
    pastTimesheets.forEach(p => {
      const key = `${p.year}-${p.month}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(p);
    });
    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => new Date(keyB).getTime() - new Date(keyA).getTime())
      .slice(0, 3);
  }, [pastTimesheets]);

  if (loading || complianceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#122ec0]"></div>
      </div>
    );
  }

  const handleNavigateToSection = (section: string) => {
    if (setActiveSection) {
      setActiveSection(section);
    }
  };

  return (
    <div className="space-y-6">
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
      {profileCompletion < 100 && (
        <Card className="bg-yellow-50 border-yellow-200">
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
        </Card>
      )}

      {/* Comprehensive Compliance Breakdown */}
      {compliance && (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Compliance Breakdown - {compliance.overall_score.toFixed(0)}%
            </CardTitle>
            <CardDescription>{compliance.status_message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Feedback</span>
                  <span className="font-medium">{compliance.feedback_score.toFixed(0)}%</span>
                </div>
                <Progress value={compliance.feedback_score} className="h-2" />
                <p className="text-xs text-muted-foreground">40% of total score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bi-weekly Timesheets</span>
                  <span className="font-medium">{compliance.timesheet_score.toFixed(0)}%</span>
                </div>
                <Progress value={compliance.timesheet_score} className="h-2" />
                <p className="text-xs text-muted-foreground">35% of total score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Documents</span>
                  <span className="font-medium">{compliance.document_score.toFixed(0)}%</span>
                </div>
                <Progress value={compliance.document_score} className="h-2" />
                <p className="text-xs text-muted-foreground">15% of total score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Engagement</span>
                  <span className="font-medium">{compliance.engagement_score.toFixed(0)}%</span>
                </div>
                <Progress value={compliance.engagement_score} className="h-2" />
                <p className="text-xs text-muted-foreground">10% of total score</p>
              </div>
            </div>

            {compliance.next_actions.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Next Actions to Improve Score
                </h4>
                <ul className="space-y-1">
                  {compliance.next_actions.map((action, index) => (
                    <li key={index} className="text-sm text-amber-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Compliance Score</p>
                <p className="text-2xl font-bold text-blue-700">{compliance?.overall_score.toFixed(0) || 0}%</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={compliance?.overall_score || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Points Earned</p>
                <p className="text-2xl font-bold text-green-700">{profile?.points || 0}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Submissions</p>
                <p className="text-2xl font-bold text-purple-700">{stats.completedSubmissions}/{stats.totalSubmissions}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.overdueSubmissions > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${stats.overdueSubmissions > 0 ? 'text-red-600' : 'text-gray-600'}`}>Overdue Items</p>
                <p className={`text-2xl font-bold ${stats.overdueSubmissions > 0 ? 'text-red-700' : 'text-gray-700'}`}>{stats.overdueSubmissions}</p>
              </div>
              <div className={`p-3 rounded-full ${stats.overdueSubmissions > 0 ? 'bg-red-200' : 'bg-gray-200'}`}>
                <Clock className={`h-6 w-6 ${stats.overdueSubmissions > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bi-Weekly Timesheets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bi-Weekly Timesheets (Last 3 Months)</span>
              <Clock className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timesheetsByMonth.map(([key, periods]) => {
                const [year, month] = key.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
                const allUploaded = periods.length >= 2 && periods.every(p => p.work_timesheet_uploaded);
                
                return (
                  <Card key={key} className={allUploaded ? 'bg-green-50' : 'bg-red-50'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{monthName} {year}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {allUploaded ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">All timesheets uploaded</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Uploads are missing</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleNavigateToSection('documents')}
                            className="w-full text-xs"
                          >
                            Go to Uploads
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {periods.sort((a,b) => a.period - b.period).map(p => (
                          <Badge key={p.id} variant={p.work_timesheet_uploaded ? 'default' : 'secondary'}>S{p.period}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="bg-white shadow-lg border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-[#e16623]" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>Your latest badges and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {recentAchievements.map((achievement: any) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#122ec0]/10 to-[#e16623]/10 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#122ec0] to-[#e16623] flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{achievement.badge_name}</p>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                    </div>
                    <Badge variant="secondary">+{achievement.points_awarded}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No achievements yet</p>
                <p className="text-sm">Complete your first feedback to earn badges!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Center */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#e16623]" />
            <span>Action Center</span>
          </CardTitle>
          <CardDescription>Priority tasks to improve your compliance score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {compliance && compliance.next_actions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 mb-2">Priority Actions:</h4>
              <ul className="space-y-1">
                {compliance.next_actions.slice(0, 3).map((action, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* All Good Status */}
          {compliance && compliance.overall_score >= 90 && compliance.next_actions.length === 0 && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              🎉 Outstanding performance! You're exceeding all compliance requirements.
            </div>
          )}
        </CardContent>
      </Card>

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
            <Button 
              onClick={() => handleNavigateToSection('feedback')} 
              className="h-20 bg-gradient-to-r from-[#122ec0] to-blue-500 hover:from-[#0f2499] hover:to-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Submit Feedback</span>
              </div>
            </Button>

            <Button 
              onClick={() => handleNavigateToSection('documents')} 
              variant="outline" 
              className="h-20 border-2 border-[#e16623] text-[#e16623] hover:bg-[#e16623] hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Upload Documents</span>
              </div>
            </Button>

            <Button 
              onClick={() => handleNavigateToSection('achievements')} 
              variant="outline" 
              className="h-20 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <Award className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">View Achievements</span>
              </div>
            </Button>

            <Button 
              onClick={() => handleNavigateToSection('profile')} 
              variant="outline" 
              className="h-20 border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-1" />
                <span className="text-sm font-semibold">Profile Settings</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerDashboard;