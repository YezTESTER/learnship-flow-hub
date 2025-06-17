
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type FeedbackSubmission = Tables<'feedback_submissions'>;

const AdminDashboard = () => {
  const [learners, setLearners] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [learnersData, mentorsData, submissionsData] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'learner'),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'mentor'),
        supabase
          .from('feedback_submissions')
          .select(`
            *,
            profiles!feedback_submissions_learner_id_fkey (full_name, employer_name)
          `)
      ]);

      if (learnersData.data) setLearners(learnersData.data);
      if (mentorsData.data) setMentors(mentorsData.data);
      if (submissionsData.data) setSubmissions(submissionsData.data as any);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallCompliance = () => {
    if (learners.length === 0) return 0;
    const total = learners.reduce((sum, learner) => sum + (learner.compliance_score || 0), 0);
    return total / learners.length;
  };

  const getPendingSubmissions = () => {
    return submissions.filter(s => s.status === 'pending').length;
  };

  const getOverdueSubmissions = () => {
    return submissions.filter(s => s.status === 'overdue').length;
  };

  const getSubmittedThisMonth = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    return submissions.filter(s => 
      s.month === thisMonth + 1 && 
      s.year === thisYear && 
      s.status === 'submitted'
    ).length;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Learners */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Learners</p>
                <p className="text-3xl font-bold text-blue-700">{learners.length}</p>
              </div>
              <div className="h-12 w-12 bg-[#122ec0] rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Compliance */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Overall Compliance</p>
                <p className="text-3xl font-bold text-green-700">{getOverallCompliance().toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <Progress value={getOverallCompliance()} className="mt-3" />
          </CardContent>
        </Card>

        {/* This Month Submissions */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold text-orange-700">{getSubmittedThisMonth()}</p>
              </div>
              <div className="h-12 w-12 bg-[#e16623] rounded-full flex items-center justify-center">
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
        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Learner Compliance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learners.slice(0, 10).map((learner) => (
                <div key={learner.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{learner.full_name}</p>
                      <span className="text-sm text-gray-600">
                        {(learner.compliance_score || 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={learner.compliance_score || 0} className="h-2" />
                  </div>
                  <Badge 
                    className="ml-3"
                    variant={
                      (learner.compliance_score || 0) >= 80 ? 'secondary' :
                      (learner.compliance_score || 0) >= 60 ? 'outline' : 'destructive'
                    }
                  >
                    {(learner.compliance_score || 0) >= 80 ? 'Good' :
                     (learner.compliance_score || 0) >= 60 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.slice(0, 8).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{(submission as any).profiles?.full_name}</p>
                    <p className="text-xs text-gray-600">
                      {(submission as any).profiles?.employer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(submission.created_at!).toLocaleDateString()}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
