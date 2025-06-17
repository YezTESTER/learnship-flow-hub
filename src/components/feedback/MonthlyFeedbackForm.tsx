
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Send } from 'lucide-react';

const MonthlyFeedbackForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    attendance_rating: '5',
    self_evaluation: '',
    mentorship_received: '',
    challenges_faced: '',
    supervisor_name: '',
    additional_comments: ''
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          learner_id: user.id,
          month: currentMonth,
          year: currentYear,
          status: 'submitted',
          submission_data: formData,
          submitted_at: new Date().toISOString(),
          due_date: new Date(currentYear, currentMonth, 5).toISOString()
        });

      if (error) throw error;

      // Award points for timely submission
      await supabase
        .from('achievements')
        .insert({
          learner_id: user.id,
          badge_type: 'monthly_submission',
          badge_name: 'Monthly Report Submitted',
          description: `Submitted monthly report for ${new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
          points_awarded: 50
        });

      // Update user points
      await supabase.rpc('update_compliance_score', { user_id: user.id });

      toast.success('Monthly feedback submitted successfully!');
      
      // Reset form
      setFormData({
        attendance_rating: '5',
        self_evaluation: '',
        mentorship_received: '',
        challenges_faced: '',
        supervisor_name: '',
        additional_comments: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Monthly Feedback Form
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear} Report
          </CardDescription>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Due: 5th of each month</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-700">Attendance Rating</Label>
              <RadioGroup 
                value={formData.attendance_rating} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, attendance_rating: value }))}
                className="flex space-x-6"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                      {rating} {rating === 5 ? '(Excellent)' : rating === 1 ? '(Poor)' : ''}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="self_evaluation" className="text-lg font-semibold text-gray-700">
                Self-Evaluation of Performance
              </Label>
              <Textarea
                id="self_evaluation"
                placeholder="Describe your performance this month, achievements, and areas for improvement..."
                value={formData.self_evaluation}
                onChange={(e) => setFormData(prev => ({ ...prev, self_evaluation: e.target.value }))}
                className="min-h-[100px] rounded-xl border-gray-200"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="mentorship_received" className="text-lg font-semibold text-gray-700">
                Mentorship Received
              </Label>
              <Textarea
                id="mentorship_received"
                placeholder="Describe the mentorship and guidance you received this month..."
                value={formData.mentorship_received}
                onChange={(e) => setFormData(prev => ({ ...prev, mentorship_received: e.target.value }))}
                className="min-h-[100px] rounded-xl border-gray-200"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="challenges_faced" className="text-lg font-semibold text-gray-700">
                Challenges Faced
              </Label>
              <Textarea
                id="challenges_faced"
                placeholder="What challenges did you encounter and how did you address them?"
                value={formData.challenges_faced}
                onChange={(e) => setFormData(prev => ({ ...prev, challenges_faced: e.target.value }))}
                className="min-h-[100px] rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="supervisor_name" className="text-lg font-semibold text-gray-700">
                Supervisor/Mentor Name
              </Label>
              <Input
                id="supervisor_name"
                placeholder="Enter your supervisor's name"
                value={formData.supervisor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supervisor_name: e.target.value }))}
                className="rounded-xl border-gray-200"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="additional_comments" className="text-lg font-semibold text-gray-700">
                Additional Comments
              </Label>
              <Textarea
                id="additional_comments"
                placeholder="Any additional feedback or comments..."
                value={formData.additional_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}
                className="min-h-[80px] rounded-xl border-gray-200"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Monthly Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyFeedbackForm;
