import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Send, Calendar, Star, User, MessageSquare, AlertTriangle, Edit } from 'lucide-react';

interface FeedbackSubmission {
  id: string;
  month: number;
  year: number;
  status: string;
  submission_data: any;
  submitted_at: string;
  edited_at: string | null;
  due_date: string;
}

const MonthlyFeedbackForm = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [existingSubmission, setExistingSubmission] = useState<FeedbackSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<FeedbackSubmission | null>(null);
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
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('learner_id', user?.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    }
  };

  const checkCurrentMonthSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('learner_id', user?.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
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

  const handleFormChange = (field: string, value: string) => {
    if (editingSubmission) {
      setEditingSubmission(prev => prev ? { ...prev, submission_data: { ...prev.submission_data, [field]: value } } : null);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const submissionData = {
        learner_id: user.id,
        month: currentMonth,
        year: currentYear,
        status: 'submitted' as const,
        submission_data: formData,
        submitted_at: existingSubmission?.submitted_at || new Date().toISOString(),
        edited_at: existingSubmission ? new Date().toISOString() : null,
        due_date: new Date(currentYear, currentMonth, 5).toISOString(),
      };

      let result;
      if (existingSubmission) {
        result = await supabase.from('feedback_submissions').update(submissionData).eq('id', existingSubmission.id);
      } else {
        result = await supabase.from('feedback_submissions').insert(submissionData);
      }

      if (result.error) throw result.error;

      if (!existingSubmission) {
        await supabase.from('achievements').insert({
          learner_id: user.id,
          badge_type: 'monthly_submission',
          badge_name: 'Monthly Report Submitted',
          description: `Successfully submitted monthly report for ${new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          points_awarded: 10,
          badge_color: '#10B981',
          badge_icon: 'file-text'
        });
      }

      toast.success(`Monthly feedback ${existingSubmission ? 'updated' : 'submitted'} successfully!`);
      fetchSubmissions();
      checkCurrentMonthSubmission();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;
    setLoading(true);

    try {
      const result = await supabase
        .from('feedback_submissions')
        .update({
          submission_data: editingSubmission.submission_data,
          edited_at: new Date().toISOString(),
        })
        .eq('id', editingSubmission.id);

      if (result.error) throw result.error;

      toast.success('Feedback updated successfully!');
      setEditingSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update feedback');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (submission: FeedbackSubmission) => {
    setEditingSubmission(submission);
  };

  const isEditable = (submittedAt: string) => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return new Date(submittedAt) > fiveDaysAgo;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-green-600 bg-green-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
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
      {/* Current Month Submission Form */}
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
                  <Select value={formData.attendance_rating} onValueChange={value => handleFormChange('attendance_rating', value)}>
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
                  <Select value={formData.performance_rating} onValueChange={value => handleFormChange('performance_rating', value)}>
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
              </div>
            </div>

            {/* Progress and Achievements */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress and Achievements</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="achievements">Key Achievements This Month</Label>
                  <Textarea id="achievements" value={formData.achievements} onChange={e => handleFormChange('achievements', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe your main achievements and milestones" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning_objectives">Learning Objectives Met</Label>
                  <Textarea id="learning_objectives" value={formData.learning_objectives} onChange={e => handleFormChange('learning_objectives', e.target.value)} className="rounded-xl border-gray-200" placeholder="Which learning objectives did you meet this month?" rows={3} />
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
                  <Textarea id="challenges_faced" value={formData.challenges_faced} onChange={e => handleFormChange('challenges_faced', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe any challenges or difficulties you encountered" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentorship_received">Mentorship and Support Received</Label>
                  <Textarea id="mentorship_received" value={formData.mentorship_received} onChange={e => handleFormChange('mentorship_received', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe the mentorship and support you received" rows={3} />
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
                  <Input id="supervisor_name" value={formData.supervisor_name} onChange={e => handleFormChange('supervisor_name', e.target.value)} className="rounded-xl border-gray-200" placeholder="Enter your supervisor's name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor_feedback">Supervisor Comments (if any)</Label>
                  <Textarea id="supervisor_feedback" value={formData.supervisor_feedback} onChange={e => handleFormChange('supervisor_feedback', e.target.value)} className="rounded-xl border-gray-200" placeholder="Any comments from your supervisor" rows={3} />
                </div>
              </div>
            </div>

            {/* Additional Comments */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
              <div className="space-y-2">
                <Label htmlFor="additional_comments">Additional Comments</Label>
                <Textarea id="additional_comments" value={formData.additional_comments} onChange={e => handleFormChange('additional_comments', e.target.value)} className="rounded-xl border-gray-200" placeholder="Any other comments or feedback" rows={4} />
              </div>
            </div>

            <Button type="submit" disabled={loading || existingSubmission?.status === 'submitted'} className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 font-semibold transition-all duration-300 transform hover:scale-105 text-base">
              {loading ? 'Submitting...' : existingSubmission?.status === 'submitted' ? 'Already Submitted' : <>
                  <Send className="mr-2 h-5 w-5" />
                  {existingSubmission ? 'Update Submission' : 'Submit Monthly Feedback'}
                </>}
            </Button>
          </form>
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
              {submissions.map(submission => (
                <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {new Date(submission.year, submission.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      {submission.edited_at && <span className="ml-2 text-xs text-gray-500">(Edited)</span>}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.toUpperCase()}
                    </span>
                    {isEditable(submission.submitted_at) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(submission)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>}

      {/* Edit Feedback Modal */}
      {editingSubmission && (
        <Dialog open={!!editingSubmission} onOpenChange={() => setEditingSubmission(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Feedback for {new Date(editingSubmission.year, editingSubmission.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</DialogTitle>
              <DialogDescription>Make changes to your submitted feedback. Remember, you can only edit submissions from the last 5 days.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-attendance_rating">Attendance Rating (1-5)</Label>
                <Select value={editingSubmission?.submission_data.attendance_rating || ''} onValueChange={value => handleFormChange('attendance_rating', value)}>
                  <SelectTrigger id="edit-attendance_rating" className="rounded-xl">
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
                <Label htmlFor="edit-performance_rating">Overall Performance (1-5)</Label>
                <Select value={editingSubmission?.submission_data.performance_rating || ''} onValueChange={value => handleFormChange('performance_rating', value)}>
                  <SelectTrigger id="edit-performance_rating" className="rounded-xl">
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
                <Label htmlFor="edit-achievements">Key Achievements This Month</Label>
                <Textarea id="edit-achievements" value={editingSubmission?.submission_data.achievements || ''} onChange={e => handleFormChange('achievements', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe your main achievements and milestones" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-learning_objectives">Learning Objectives Met</Label>
                <Textarea id="edit-learning_objectives" value={editingSubmission?.submission_data.learning_objectives || ''} onChange={e => handleFormChange('learning_objectives', e.target.value)} className="rounded-xl border-gray-200" placeholder="Which learning objectives did you meet this month?" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-challenges_faced">Challenges Faced</Label>
                <Textarea id="edit-challenges_faced" value={editingSubmission?.submission_data.challenges_faced || ''} onChange={e => handleFormChange('challenges_faced', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe any challenges or difficulties you encountered" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-mentorship_received">Mentorship and Support Received</Label>
                <Textarea id="edit-mentorship_received" value={editingSubmission?.submission_data.mentorship_received || ''} onChange={e => handleFormChange('mentorship_received', e.target.value)} className="rounded-xl border-gray-200" placeholder="Describe the mentorship and support you received" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supervisor_name">Supervisor Name</Label>
                <Input id="edit-supervisor_name" value={editingSubmission?.submission_data.supervisor_name || ''} onChange={e => handleFormChange('supervisor_name', e.target.value)} className="rounded-xl border-gray-200" placeholder="Enter your supervisor's name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supervisor_feedback">Supervisor Comments (if any)</Label>
                <Textarea id="edit-supervisor_feedback" value={editingSubmission?.submission_data.supervisor_feedback || ''} onChange={e => handleFormChange('supervisor_feedback', e.target.value)} className="rounded-xl border-gray-200" placeholder="Any comments from your supervisor" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-additional_comments">Additional Comments</Label>
                <Textarea id="edit-additional_comments" value={editingSubmission?.submission_data.additional_comments || ''} onChange={e => handleFormChange('additional_comments', e.target.value)} className="rounded-xl border-gray-200" placeholder="Any other comments or feedback" rows={4} />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>;
};

export default MonthlyFeedbackForm;
