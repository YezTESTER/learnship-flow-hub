import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type FeedbackSubmission = Tables<'feedback_submissions'>;

interface MentorDashboardProps {
  setActiveSection?: (section: string) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ setActiveSection }) => {
  const { profile } = useAuth();
  const [learners, setLearners] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // For now, we'll fetch assigned learners only
      // In a full implementation, we would check the mentor's visibility settings
      const { data: learnersData, error: learnersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('mentor_id', profile!.id)
        .eq('role', 'learner');

      if (learnersError) throw learnersError;

      if (learnersData) {
        setLearners(learnersData);
        
        // Now fetch submissions for these learners
        const learnerIds = learnersData.map(l => l.id);
        if (learnerIds.length > 0) {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('feedback_submissions')
            .select(`
              *,
              profiles!feedback_submissions_learner_id_fkey (full_name)
            `)
            .in('learner_id', learnerIds);
          
          if (submissionsError) throw submissionsError;
          if (submissionsData) setSubmissions(submissionsData as any);
        } else {
          setSubmissions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPendingReviews = () => {
    return submissions.filter(s => s.status === 'submitted' && !s.mentor_feedback).length;
  };

  const getOverdueSubmissions = () => {
    return submissions.filter(s => s.status === 'overdue').length;
  };

  const getAverageCompliance = () => {
    if (learners.length === 0) return 0;
    const total = learners.reduce((sum, learner) => sum + (learner.compliance_score || 0), 0);
    return total / learners.length;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold text-orange-700">{getPendingReviews()}</p>
              </div>
              <div className="h-12 w-12 bg-[#e16623] rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Avg Compliance</p>
                <p className="text-3xl font-bold text-green-700">{getAverageCompliance().toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>My Learners</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {learners.map((learner) => (
                <div key={learner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{learner.full_name}</p>
                    <p className="text-sm text-gray-600">{learner.learnership_program}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{(learner.compliance_score || 0).toFixed(0)}%</p>
                    <Badge variant={
                      (learner.compliance_score || 0) >= 80 ? 'secondary' :
                      (learner.compliance_score || 0) >= 60 ? 'outline' : 'destructive'
                    }>
                      {(learner.compliance_score || 0) >= 80 ? 'Excellent' :
                       (learner.compliance_score || 0) >= 60 ? 'Good' : 'Needs Attention'}
                    </Badge>
                  </div>
                </div>
              ))}
              {learners.length === 0 && (
                <p className="text-gray-500 text-center py-4">No learners assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{(submission as any).profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(submission.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      submission.status === 'submitted' ? 'default' :
                      submission.status === 'approved' ? 'secondary' :
                      submission.status === 'overdue' ? 'destructive' : 'outline'
                    }>
                      {submission.status}
                    </Badge>
                    {submission.status === 'submitted' && !submission.mentor_feedback && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (setActiveSection) {
                            setActiveSection('feedback-review');
                            // Store the submission info in localStorage
                            localStorage.setItem('feedbackReviewSubmission', JSON.stringify({
                              learnerId: submission.learner_id,
                              month: submission.month,
                              year: submission.year
                            }));
                          }
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No submissions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorDashboard;