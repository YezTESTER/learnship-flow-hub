
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  FileText, 
  Upload, 
  Award, 
  CheckCircle,
  X
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Welcome to Your Learnership Portal!",
      description: "Let's take a quick tour to help you get started with your learnership journey.",
      icon: <Award className="h-12 w-12 text-[#122ec0]" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Hi {profile?.full_name}! This portal will help you manage your learnership activities, 
            track your progress, and stay compliant with all requirements.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What you can do here:</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Submit monthly feedback reports</li>
              <li>• Upload required documents</li>
              <li>• Track your compliance score</li>
              <li>• Earn achievement badges</li>
              <li>• Manage your profile</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Complete Your Profile First",
      description: "Your profile contains important information needed for compliance tracking.",
      icon: <User className="h-12 w-12 text-[#e16623]" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Start by completing your profile with all required information. This includes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-orange-50 p-3 rounded-lg">
              <strong className="text-orange-800">Personal Details:</strong>
              <ul className="text-orange-700 mt-1">
                <li>• Full name & ID number</li>
                <li>• Contact information</li>
                <li>• Emergency contact</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <strong className="text-orange-800">Learnership Info:</strong>
              <ul className="text-orange-700 mt-1">
                <li>• Program details</li>
                <li>• Employer information</li>
                <li>• Start & end dates</li>
              </ul>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> A complete profile helps calculate your compliance score accurately!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Monthly Feedback Submissions",
      description: "Submit your monthly reports to maintain compliance and track progress.",
      icon: <FileText className="h-12 w-12 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Each month, you'll need to submit a feedback report that includes:
          </p>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <strong className="text-green-800">Monthly Report Contains:</strong>
              <ul className="text-green-700 mt-1 text-sm">
                <li>• Attendance rating (1-5 scale)</li>
                <li>• Self-evaluation of performance</li>
                <li>• Description of mentorship received</li>
                <li>• Challenges faced during the month</li>
                <li>• Supervisor confirmation</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> Submit your reports on time to maintain a high compliance score!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Document Uploads",
      description: "Upload supporting documents to maintain compliance records.",
      icon: <Upload className="h-12 w-12 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload relevant documents to support your learnership activities:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-purple-50 p-3 rounded-lg">
              <strong className="text-purple-800">Document Types:</strong>
              <ul className="text-purple-700 mt-1">
                <li>• Attendance proof</li>
                <li>• Logbook pages</li>
                <li>• Assessments</li>
                <li>• Other supporting docs</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <strong className="text-purple-800">Requirements:</strong>
              <ul className="text-purple-700 mt-1">
                <li>• Max 10MB file size</li>
                <li>• PDF, Word, or Images</li>
                <li>• Clear, readable files</li>
                <li>• Descriptive names</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Track Your Progress",
      description: "Monitor your compliance score and earn achievement badges.",
      icon: <CheckCircle className="h-12 w-12 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Your dashboard shows your progress and achievements:
          </p>
          <div className="space-y-3">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <strong className="text-indigo-800">Compliance Score:</strong>
              <p className="text-indigo-700 text-sm mt-1">
                Based on timely submission of monthly reports. Higher scores show better compliance!
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <strong className="text-indigo-800">Achievement Badges:</strong>
              <p className="text-indigo-700 text-sm mt-1">
                Earn points and badges for completing tasks like submitting reports and uploading documents.
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>Goal:</strong> Maintain 100% compliance by submitting all reports on time!
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed for this user
      await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString(),
          // You could add an onboarding_completed field to track this
        })
        .eq('id', profile?.id);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
    
    onComplete();
    onClose();
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {currentStepData.description}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex space-x-1">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-[#122ec0]'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button onClick={handleNext} className="bg-[#122ec0] hover:bg-[#0f2499]">
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
