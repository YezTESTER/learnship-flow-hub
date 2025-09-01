import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerformancePoints } from '@/hooks/usePerformancePoints';
import { Calendar, Clock, CheckCircle, Star, User, FileText, AlertTriangle, Send } from 'lucide-react';
interface FeedbackSubmission {
  id: string;
  month: number;
  year: number;
  status: string;
  submission_data: any;
  submitted_at: string;
  due_date: string;
  mentor_comments?: string | null;
  mentor_rating?: number | null;
}
const MonthlyFeedbackForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { awardPoints } = usePerformancePoints();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [existingSubmission, setExistingSubmission] = useState<FeedbackSubmission | null>(null);
  const [formData, setFormData] = useState({
    attendance_rating: '',
    performance_rating: '',
    challenges_faced: '',
    achievements: '',
    mentorship_received: '',
    supervisor_name: '',
    supervisor_feedback: '',
    learning_objectives: '',
    additional_comments: ''
  });
  useEffect(() => {
    if (user) {
      fetchSubmissions();
      checkCurrentMonthSubmission();
    }
  }, [user, currentMonth, currentYear]);
  const fetchSubmissions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('feedback_submissions').select('*').eq('learner_id', user?.id).order('year', {
        ascending: false
      }).order('month', {
        ascending: false
      });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    }
  };
  const checkCurrentMonthSubmission = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('feedback_submissions').select('*').eq('learner_id', user?.id).eq('month', currentMonth).eq('year', currentYear).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setExistingSubmission(data);
        if (data.submission_data && typeof data.submission_data === 'object') {
          setFormData(data.submission_data as typeof formData);
        }
      }
    } catch (error: any) {
      console.error('Error checking current submission:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const dueDate = new Date(currentYear, currentMonth, 5); // Due on the 5th of next month

      const submissionData = {
        learner_id: user.id,
        month: currentMonth,
        year: currentYear,
        status: 'submitted' as const,
        submission_data: formData,
        submitted_at: new Date().toISOString(),
        due_date: dueDate.toISOString()
      };
      let result;
      if (existingSubmission) {
        result = await supabase.from('feedback_submissions').update(submissionData).eq('id', existingSubmission.id);
      } else {
        result = await supabase.from('feedback_submissions').insert(submissionData);
      }
      if (result.error) throw result.error;

      // Award performance-based points for submission
      await awardPoints(
        'feedback_submission',
        10,
        `Monthly Feedback - ${new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      );

      toast({
        title: "Success",
        description: "Monthly feedback submitted successfully!",
      });
      fetchSubmissions();
      checkCurrentMonthSubmission();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-green-600 bg-green-50';
      case 'approved':
        return 'text-blue-600 bg-blue-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };
  if (profile?.role !== 'learner') {
    return <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Monthly feedback forms are only available to learners.</p>
      </div>;
  }
  return <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Month Submission */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <FileText className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Monthly Feedback - {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            {existingSubmission ? `Submitted on ${new Date(existingSubmission.submitted_at).toLocaleDateString()}` : 'Complete your monthly performance evaluation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Performance Ratings */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Performance Ratings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attendance_rating">Attendance Rating (1-5)</Label>
                  <Select value={formData.attendance_rating} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  attendance_rating: value
                }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performance_rating">Overall Performance (1-5)</Label>
                  <Select value={formData.performance_rating} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  performance_rating: value
                }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">Feedback - July 2025</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Progress and Achievements */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress and Achievements</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="achievements">Key Achievements This Month</Label>
                  <Textarea id="achievements" value={formData.achievements} onChange={e => setFormData(prev => ({
                  ...prev,
                  achievements: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Describe your main achievements and milestones" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning_objectives">Learning Objectives Met</Label>
                  <Textarea id="learning_objectives" value={formData.learning_objectives} onChange={e => setFormData(prev => ({
                  ...prev,
                  learning_objectives: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Which learning objectives did you meet this month?" rows={3} />
                </div>
              </div>
            </div>

            {/* Challenges and Support */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Challenges and Support
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="challenges_faced">Challenges Faced</Label>
                  <Textarea id="challenges_faced" value={formData.challenges_faced} onChange={e => setFormData(prev => ({
                  ...prev,
                  challenges_faced: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Describe any challenges or difficulties you encountered" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentorship_received">Mentorship and Support Received</Label>
                  <Textarea id="mentorship_received" value={formData.mentorship_received} onChange={e => setFormData(prev => ({
                  ...prev,
                  mentorship_received: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Describe the mentorship and support you received" rows={3} />
                </div>
              </div>
            </div>

            {/* Supervisor Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Supervisor Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor_name">Supervisor Name</Label>
                  <Input id="supervisor_name" value={formData.supervisor_name} onChange={e => setFormData(prev => ({
                  ...prev,
                  supervisor_name: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Enter your supervisor's name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor_feedback">Supervisor Comments (if any)</Label>
                  <Textarea id="supervisor_feedback" value={formData.supervisor_feedback} onChange={e => setFormData(prev => ({
                  ...prev,
                  supervisor_feedback: e.target.value
                }))} className="rounded-xl border-gray-200" placeholder="Any comments from your supervisor" rows={3} />
                </div>
              </div>
            </div>

            {/* Additional Comments */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <div className="space-y-2">
                <Label htmlFor="additional_comments">Additional Comments</Label>
                <Textarea id="additional_comments" value={formData.additional_comments} onChange={e => setFormData(prev => ({
                ...prev,
                additional_comments: e.target.value
              }))} className="rounded-xl border-gray-200" placeholder="Any other comments or feedback" rows={4} />
              </div>
            </div>

            <Button type="submit" disabled={loading || existingSubmission?.status === 'submitted'} className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 font-semibold transition-all duration-300 transform hover:scale-105 text-base">
              {loading ? 'Submitting...' : existingSubmission?.status === 'submitted' ? 'Already Submitted' : <>
                  <Send className="mr-2 h-5 w-5" />
                  {existingSubmission ? 'Update Submission' : 'Submit Monthly Feedback'}
                </>}
            </Button>
            </form>

            {existingSubmission && (existingSubmission.mentor_comments || typeof (existingSubmission.mentor_rating as any) === 'number') && (
              <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Manager Review
                </h3>
                {typeof (existingSubmission.mentor_rating as any) === 'number' && (
                  <div className="flex items-center mb-2">
                    {[1,2,3].map((v) => (
                      <Star key={v} className={`h-4 w-4 mr-1 ${((existingSubmission.mentor_rating as number) ?? 0) >= v ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{existingSubmission.mentor_rating} / 3</span>
                  </div>
                )}
                {existingSubmission.mentor_comments && (
                  <p className="text-gray-700 whitespace-pre-wrap">{existingSubmission.mentor_comments}</p>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Previous Submissions */}
      {submissions.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Previous Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map(submission => <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {new Date(submission.year, submission.month - 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status.toUpperCase()}
                  </span>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default MonthlyFeedbackForm;