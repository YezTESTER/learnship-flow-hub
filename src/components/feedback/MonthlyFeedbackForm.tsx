import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerformancePoints } from '@/hooks/usePerformancePoints';
import { Calendar, Clock, CheckCircle, Star, User, FileText, AlertTriangle, Send, Eye, Lock } from 'lucide-react';
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
  is_editable_by_learner?: boolean;
}
const MonthlyFeedbackForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { awardPoints } = usePerformancePoints();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [existingSubmission, setExistingSubmission] = useState<FeedbackSubmission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<FeedbackSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    attendance_rating: '',
    performance_rating: '',
    challenges_faced: '',
    achievements: '',
    mentorship_received: '',
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
    
    // Check if editing is allowed
    if (existingSubmission && !existingSubmission.is_editable_by_learner) {
      toast({
        title: "Cannot Edit",
        description: "This submission is locked. Contact your manager to enable editing.",
        variant: "destructive",
      });
      return;
    }
    
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
        due_date: dueDate.toISOString(),
        is_editable_by_learner: false // Lock after submission
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

  const getSubmissionForMonth = (month: number, year: number) => {
    return submissions.find(s => s.month === month && s.year === year);
  };

  const handleViewSubmission = (submission: FeedbackSubmission) => {
    setViewingSubmission(submission);
    setIsViewDialogOpen(true);
  };

  const getPastMonths = () => {
    const months = [];
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();
    
    for (let month = 1; month <= 12; month++) {
      // Only show months up to current month for current year
      if (selectedYear === currentYearNum && month > currentMonthNum) {
        continue;
      }
      // Don't show future years
      if (selectedYear > currentYearNum) {
        continue;
      }
      months.push(month);
    }
    return months;
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = profile?.start_date ? new Date(profile.start_date).getFullYear() : currentYear - 2;
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
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

  const isCurrentMonth = currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();
  const canEdit = isCurrentMonth && (!existingSubmission || existingSubmission.is_editable_by_learner);

  return <div className="max-w-4xl mx-auto space-y-6">
      {/* Past Submissions Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>My Feedback History</span>
            </CardTitle>
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableYears().map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getPastMonths().map(month => {
              const submission = getSubmissionForMonth(month, selectedYear);
              const monthName = new Date(selectedYear, month - 1).toLocaleDateString('en-US', { month: 'short' });
              const isCurrentPeriod = month === currentMonth && selectedYear === currentYear;
              
              return (
                <div key={month} className="relative">
                  <Button
                    variant={submission ? "default" : "outline"}
                    className={`w-full h-20 flex flex-col items-center justify-center ${
                      isCurrentPeriod ? 'ring-2 ring-[#122ec0]' : ''
                    } ${submission?.status === 'submitted' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => submission && handleViewSubmission(submission)}
                    disabled={!submission}
                  >
                    <span className="font-semibold">{monthName}</span>
                    <span className="text-xs mt-1">
                      {submission ? (
                        submission.status === 'submitted' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )
                      ) : (
                        'No submission'
                      )}
                    </span>
                    {isCurrentPeriod && (
                      <Badge className="absolute -top-2 -right-2 text-xs" variant="default">
                        Current
                      </Badge>
                    )}
                  </Button>
                  {submission && !submission.is_editable_by_learner && submission.status === 'submitted' && (
                    <Lock className="absolute top-1 right-1 h-3 w-3 text-white" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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

            {!canEdit && existingSubmission && (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-xl mb-4">
                <Lock className="h-5 w-5" />
                <span className="text-sm">This submission is locked. Contact your manager to enable editing.</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading || !canEdit} 
              className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 font-semibold transition-all duration-300 transform hover:scale-105 text-base disabled:opacity-50"
            >
              {loading ? 'Submitting...' : !canEdit ? 'Locked' : <>
                  <Send className="mr-2 h-5 w-5" />
                  {existingSubmission ? 'Update Submission' : 'Submit Monthly Feedback'}
                </>}
            </Button>
            </form>

            {/* Supervisor Information (Read-only) */}
            {existingSubmission?.submission_data && (existingSubmission.submission_data.supervisor_name || existingSubmission.submission_data.supervisor_feedback) && (
              <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100 px-[10px]">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Supervisor Information
                </h3>
                {existingSubmission.submission_data.supervisor_name && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Supervisor Name</p>
                    <p className="text-gray-800 font-medium">{existingSubmission.submission_data.supervisor_name}</p>
                  </div>
                )}
                {existingSubmission.submission_data.supervisor_feedback && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Supervisor Feedback</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{existingSubmission.submission_data.supervisor_feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Manager Review */}
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

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Feedback - {viewingSubmission && new Date(viewingSubmission.year, viewingSubmission.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          
          {viewingSubmission && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(viewingSubmission.status)}>
                  {viewingSubmission.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  Submitted: {new Date(viewingSubmission.submitted_at).toLocaleDateString()}
                </span>
              </div>

              {/* Performance Ratings */}
              {viewingSubmission.submission_data && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Performance Ratings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Attendance</p>
                        <p className="font-medium">{viewingSubmission.submission_data.attendance_rating}/5</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Performance</p>
                        <p className="font-medium">{viewingSubmission.submission_data.performance_rating}/5</p>
                      </div>
                    </div>
                  </div>

                  {/* Achievements & Learning */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Progress</h3>
                    {viewingSubmission.submission_data.achievements && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Achievements</p>
                        <p className="text-sm">{viewingSubmission.submission_data.achievements}</p>
                      </div>
                    )}
                    {viewingSubmission.submission_data.learning_objectives && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Learning Objectives</p>
                        <p className="text-sm">{viewingSubmission.submission_data.learning_objectives}</p>
                      </div>
                    )}
                  </div>

                  {/* Challenges & Support */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Challenges & Support</h3>
                    {viewingSubmission.submission_data.challenges_faced && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Challenges</p>
                        <p className="text-sm">{viewingSubmission.submission_data.challenges_faced}</p>
                      </div>
                    )}
                    {viewingSubmission.submission_data.mentorship_received && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Mentorship Received</p>
                        <p className="text-sm">{viewingSubmission.submission_data.mentorship_received}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Comments */}
                  {viewingSubmission.submission_data.additional_comments && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Additional Comments</h3>
                      <p className="text-sm">{viewingSubmission.submission_data.additional_comments}</p>
                    </div>
                  )}

                  {/* Supervisor Information */}
                  {(viewingSubmission.submission_data.supervisor_name || viewingSubmission.submission_data.supervisor_feedback) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Supervisor Information
                      </h3>
                      {viewingSubmission.submission_data.supervisor_name && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">Supervisor</p>
                          <p className="font-medium">{viewingSubmission.submission_data.supervisor_name}</p>
                        </div>
                      )}
                      {viewingSubmission.submission_data.supervisor_feedback && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Supervisor Feedback</p>
                          <p className="text-sm">{viewingSubmission.submission_data.supervisor_feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Manager Review */}
              {(viewingSubmission.mentor_comments || typeof viewingSubmission.mentor_rating === 'number') && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Manager Review
                  </h3>
                  {typeof viewingSubmission.mentor_rating === 'number' && (
                    <div className="flex items-center mb-2">
                      {[1, 2, 3].map((v) => (
                        <Star 
                          key={v} 
                          className={`h-4 w-4 mr-1 ${
                            (viewingSubmission.mentor_rating ?? 0) >= v 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{viewingSubmission.mentor_rating} / 3</span>
                    </div>
                  )}
                  {viewingSubmission.mentor_comments && (
                    <p className="text-sm whitespace-pre-wrap">{viewingSubmission.mentor_comments}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>;
};
export default MonthlyFeedbackForm;