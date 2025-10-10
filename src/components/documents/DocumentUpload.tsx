import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Upload, FileText, Download, Trash2, Eye, File, CheckCircle, AlertCircle, FolderOpen, HelpCircle } from 'lucide-react';
interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
}

interface TimesheetSchedule {
  id: string;
  month: number;
  year: number;
  period: number;
  work_timesheet_uploaded: boolean;
  class_timesheet_uploaded: boolean;
  due_date: string; uploaded_at: string | null;
}

const DocumentUpload = () => {
  const {
    user,
    profile
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timesheetSchedules, setTimesheetSchedules] = useState<TimesheetSchedule[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploadTarget, setUploadTarget] = useState<{ periodId: string; type: 'work' | 'class' } | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingUploadTarget, setPendingUploadTarget] = useState<{ periodId: string; type: 'work' | 'class' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadCompleted, setUploadCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchTimesheetSchedules();
    }
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (user) {
      fetchTimesheetSchedules();
    }
  }, [selectedYear, user, refreshTrigger]);

  // New effect to handle post-upload refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (uploadCompleted) {
      // After a successful upload, refresh the schedules
      timeoutId = setTimeout(() => {
        fetchTimesheetSchedules();
        setUploadCompleted(false);
      }, 1500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [uploadCompleted]);

  // Effect to handle upload target changes
  useEffect(() => {
    console.log('Upload target changed:', uploadTarget);
  }, [uploadTarget]);

  // Effect to monitor when the component might be reverting state
  useEffect(() => {
    console.log('Component re-rendered. Current timesheetSchedules length:', timesheetSchedules.length);
    const uploadedSchedules = timesheetSchedules.filter(s => s.work_timesheet_uploaded);
    console.log('Currently uploaded schedules:', uploadedSchedules.length);
    if (uploadedSchedules.length > 0) {
      console.log('Uploaded schedule IDs:', uploadedSchedules.map(s => s.id));
    }
  }, [timesheetSchedules]);

  // Periodic refresh to ensure data consistency (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) {
        fetchTimesheetSchedules();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [user, loading]);

  // Effect to synchronize pendingUploadTarget with uploadTarget
  useEffect(() => {
    if (pendingUploadTarget) {
      setUploadTarget(pendingUploadTarget);
      setPendingUploadTarget(null);
    }
  }, [pendingUploadTarget]);

  const documentCategories = {
    personal: {
      title: 'Personal Documents',
      icon: '👤',
      documents: [{
        value: 'qualifications',
        label: 'Qualifications',
        points: 10,
        required: true
      }, {
        value: 'certified_id',
        label: 'Certified ID',
        points: 10,
        required: true
      }, {
        value: 'certified_proof_residence',
        label: 'Certified Proof of Residence',
        points: 10,
        required: true
      }, {
        value: 'proof_bank_account',
        label: 'Proof of Bank Account',
        points: 0,
        required: false,
        whenRequired: true
      }, {
        value: 'drivers_license',
        label: 'Drivers License',
        points: 0,
        required: false
      }, {
        value: 'cv_upload',
        label: 'CV',
        points: 15,
        required: true
      }]
    },
    office: {
      title: 'Log books & Timesheets',
      icon: '📋',
      documents: [{
        value: 'work_attendance_log',
        label: 'Bi-Weekly Timesheets',
        points: 17.5, // Changed from 10 to 17.5 to align with 35% compliance score weight (17.5 points per timesheet × 2 periods = 35 max points)
        required: false,
        whenRequired: true
      }, {
        value: 'class_attendance_proof',
        label: 'Class Attendance Timesheet',
        points: 0,
        required: false,
        whenRequired: true
      }]
    },
    contracts: {
      title: 'Contracts',
      icon: '📄',
      documents: [{
        value: 'induction_form',
        label: 'Induction Form',
        points: 0,
        required: false,
        whenRequired: true
      }, {
        value: 'popia_form',
        label: 'POPIA Form',
        points: 5,
        required: true
      }, {
        value: 'learner_consent_policy',
        label: 'Learner Consent and Policy Agreement',
        points: 0,
        required: false,
        whenRequired: true
      }, {
        value: 'employment_contract',
        label: 'Employment Contract',
        points: 0,
        required: false,
        whenRequired: true
      }, {
        value: 'learnership_contract',
        label: 'Learnership Contract',
        points: 0,
        required: false,
        whenRequired: true
      }]
    }
  };
  // Helpers to evaluate document badges
  const getPersonalDocsConfig = () => documentCategories.personal.documents;
  const requiredPersonalDocTypes = () => getPersonalDocsConfig().filter(d => d.required).map(d => d.value);
  const allPersonalDocTypes = () => getPersonalDocsConfig().map(d => d.value);

  const checkAndAwardDocumentBadges = async (currentDocs: Document[]) => {
    if (!user) return;
    try {
      const presentTypes = new Set(currentDocs.map(d => d.document_type));
      const required = requiredPersonalDocTypes();
      const all = allPersonalDocTypes();

      const hasAllRequired = required.every(t => presentTypes.has(t));
      const hasAllPersonal = all.every(t => presentTypes.has(t));

      // Helper to ensure single-award
      const hasBadge = async (name: string) => {
        const { data } = await supabase
          .from('achievements')
          .select('id')
          .eq('learner_id', user.id)
          .eq('badge_type', 'document_upload')
          .eq('badge_name', name)
          .maybeSingle();
        return !!data;
      };

      if (hasAllRequired && !(await hasBadge('Required Documents Complete'))) {
        await supabase.from('achievements').insert({
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: 'Required Documents Complete',
          description: 'All required personal documents uploaded',
          points_awarded: 25,
          badge_color: '#10B981',
          badge_icon: 'check-circle',
        });
        await supabase.rpc('create_notification', {
          target_user_id: user.id,
          notification_title: 'Required Documents Complete',
          notification_message: 'Great job! You have uploaded all required personal documents.',
          notification_type: 'success',
        });
      }

      if (hasAllPersonal && !(await hasBadge('All Personal Documents Uploaded'))) {
        await supabase.from('achievements').insert({
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: 'All Personal Documents Uploaded',
          description: 'All personal documents (required and optional) uploaded',
          points_awarded: 40,
          badge_color: '#3B82F6',
          badge_icon: 'gift',
        });
        await supabase.rpc('create_notification', {
          target_user_id: user.id,
          notification_title: 'Document Master Badge Earned',
          notification_message: 'You uploaded all personal documents and earned a badge!',
          notification_type: 'success',
        });
      }
    } catch (e) {
      console.warn('Badge evaluation failed', e);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents for user:', user?.id);

      // Fetch all documents
      const {
        data: documentsData,
        error: documentsError
      } = await supabase.from('documents').select('*').eq('learner_id', user?.id).order('uploaded_at', {
        ascending: false
      });
      if (documentsError) throw documentsError;
      console.log('Regular documents:', documentsData);

      // Process documents to extract published CVs
      const processedDocuments = [];
      for (const doc of documentsData || []) {
        // Check if this is a CV document (stored as JSON in file_path when document_type is 'other')
        if (doc.document_type === 'other' && doc.file_name.startsWith('cv_')) {
          try {
            // Parse the JSON in file_path to get CV data
            const cvData = JSON.parse(doc.file_path);

            // Only include if it's published
            if (cvData.is_published) {
              processedDocuments.push({
                ...doc,
                document_type: 'cv_upload',
                file_name: `${cvData.title || 'CV'}.pdf`,
                // Use CV title from JSON
                file_path: doc.file_path // Keep original for download/delete logic
              });
            }
          } catch (parseError) {
            console.warn('Failed to parse CV data:', parseError);
            // If parsing fails, treat as regular document
            processedDocuments.push(doc);
          }
        } else {
          // Regular document
          processedDocuments.push(doc);
        }
      }
      console.log('Processed documents with CVs:', processedDocuments);
      setDocuments(processedDocuments);
      await checkAndAwardDocumentBadges(processedDocuments);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  // Helper function to deeply compare two timesheet schedules
  const areSchedulesEqual = (a: TimesheetSchedule, b: TimesheetSchedule): boolean => {
    return (
      a.id === b.id &&
      a.month === b.month &&
      a.year === b.year &&
      a.period === b.period &&
      a.work_timesheet_uploaded === b.work_timesheet_uploaded &&
      a.class_timesheet_uploaded === b.class_timesheet_uploaded &&
      a.due_date === b.due_date &&
      a.uploaded_at === b.uploaded_at
    );
  };

  const fetchTimesheetSchedules = async (retryCount = 0) => {
    if (!user) return;
    try {
      console.log('Fetching timesheet schedules for user:', user.id, 'and year:', selectedYear, 'retry:', retryCount);
      const { data, error } = await supabase
        .from('timesheet_schedules')
        .select('*')
        .eq('learner_id', user.id)
        .eq('year', selectedYear)
        .order('month', { ascending: true })
        .order('period', { ascending: true });

      if (error) throw error;
      
      // Log the fetched data for debugging
      console.log(`Fetched ${data?.length || 0} timesheet schedules for year ${selectedYear}:`, data);
      
      // Check if any schedules have work_timesheet_uploaded = true
      const uploadedSchedules = data?.filter(s => s.work_timesheet_uploaded) || [];
      console.log('Uploaded schedules count:', uploadedSchedules.length);
      
      // Only update state if data has actually changed
      setTimesheetSchedules(prevSchedules => {
        // Compare the new data with the existing data
        const hasChanged = prevSchedules.length !== data?.length || 
          prevSchedules.some((prev, index) => {
            const current = data?.[index];
            return !current || !areSchedulesEqual(prev, current);
          });
      
        if (hasChanged) {
          console.log('Timesheet schedules have changed, updating state');
          return data || [];
        } else {
          console.log('Timesheet schedules unchanged, skipping state update');
          return prevSchedules;
        }
      });
    } catch (error: any) {
      console.error('Error fetching timesheet schedules:', error);
      
      // Retry logic for transient errors
      if (retryCount < 3) {
        console.log(`Retrying fetchTimesheetSchedules, attempt ${retryCount + 1}`);
        setTimeout(() => {
          fetchTimesheetSchedules(retryCount + 1);
        }, 500 * (retryCount + 1)); // Exponential backoff
      } else {
        toast.error('Failed to load timesheet schedules after multiple attempts');
      }
    }
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, Word documents, and images are allowed');
        return;
      }
      setSelectedFile(file);
    }
  };
  const getDocumentInfo = (docType: string) => {
    for (const category of Object.values(documentCategories)) {
      const doc = category.documents.find(d => d.value === docType);
      if (doc) return doc;
    }
    return null;
  };
  const getBucketForDocumentType = (docType: string) => {
    for (const [categoryKey, category] of Object.entries(documentCategories)) {
      const doc = category.documents.find(d => d.value === docType);
      if (doc) {
        switch (categoryKey) {
          case 'personal':
            return 'personal-documents';
          case 'office':
            return 'office-documents';
          case 'contracts':
            return 'contracts';
          default:
            return 'personal-documents';
        }
      }
    }
    return 'personal-documents';
  };
  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user) {
      toast.error('Please select a file and document type');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      // Store the periodId for later use since uploadTarget might change
      const currentPeriodId = uploadTarget?.periodId;
      
      // If this is an update, find the old document to delete it later
      let oldDocPath: string | null = null;
      if (uploadTarget) {
        try {
          // Direct query using raw SQL since table is not in generated types
          const { data: oldSubmission, error: oldSubmissionError }: any = await (supabase as any)
            .from('timesheet_submissions')
            .select('file_path')
            .eq('schedule_id', uploadTarget.periodId)
            .single();
          if (oldSubmission && !oldSubmissionError) {
            oldDocPath = oldSubmission.file_path;
          }
        } catch (err) {
          console.warn('Could not fetch old submission:', err);
        }
      }

      // Get the appropriate bucket for this document type
      const bucketName = getBucketForDocumentType(documentType);

      // Create a structured file path: bucket/learner_id/year/month/period/filename
      let filePath = '';
      if (uploadTarget) {
        const schedule = timesheetSchedules.find(s => s.id === uploadTarget.periodId);
        if (schedule) {
          filePath = `${user.id}/${schedule.year}/${schedule.month}/${schedule.period}/${selectedFile.name}`;
        }
      }
      // Fallback for non-timesheet uploads
      if (!filePath) {
        const fileExt = selectedFile.name.split('.').pop();
        filePath = `${user.id}/${Date.now()}.${fileExt}`;
      }

      // Upload file to the categorized storage bucket
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from(bucketName).upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      // Handle timesheet submission record
      let isLate = false;
      if (uploadTarget?.type === 'work') {
        const schedule = timesheetSchedules.find(s => s.id === uploadTarget.periodId);
        // Check if late submission (more than 1 week)
        const dueDate = new Date(schedule?.due_date || '');
        const oneWeekLate = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        isLate = new Date() > oneWeekLate;

        // Upsert the timesheet submission record
        // Direct query using raw SQL since table is not in generated types
        try {
          const { error: submissionError }: any = await (supabase as any)
            .from('timesheet_submissions')
            .upsert({
              schedule_id: uploadTarget.periodId,
              learner_id: user.id,
              file_name: selectedFile.name,
              file_path: uploadData.path,
              file_size: selectedFile.size,
              uploaded_at: new Date().toISOString()
            }, { onConflict: 'schedule_id' });
          
          if (submissionError) throw submissionError;
        } catch (err) {
          console.error('Error upserting timesheet submission:', err);
          throw err;
        }

        // Update the schedule table to mark as uploaded
        const { error: scheduleUpdateError } = await supabase
          .from('timesheet_schedules')
          .update({ work_timesheet_uploaded: true, uploaded_at: new Date().toISOString() })
          .eq('id', uploadTarget.periodId);
      
        if (scheduleUpdateError) throw scheduleUpdateError;
        
        // Log the update for debugging
        console.log('Timesheet schedule updated:', uploadTarget.periodId);

      } else {
        // Handle regular document uploads
        const { error: dbError } = await supabase.from('documents').insert({ learner_id: user.id, document_type: documentType as any, file_name: selectedFile.name, file_path: uploadData.path, file_size: selectedFile.size });
        if (dbError) throw dbError;
      }

      // If this was an update and the filename changed, delete the old file from storage
      if (oldDocPath && oldDocPath !== uploadData.path) {
        await supabase.storage.from(bucketName).remove([oldDocPath]);
      }

      // Award points based on document type
      const docInfo = getDocumentInfo(documentType);
      // Only award points if it's a new submission (check if schedule was already marked as uploaded)
      let wasAlreadyUploaded = false;
      if (uploadTarget?.type === 'work') {
        // For timesheet uploads, check if the schedule was already marked as uploaded
        const schedule = timesheetSchedules.find(s => s.id === uploadTarget.periodId);
        wasAlreadyUploaded = !!schedule?.work_timesheet_uploaded;
      }
      
      if (docInfo && docInfo.points > 0 && !wasAlreadyUploaded && !oldDocPath) { 
        const pointsToAward = isLate ? Math.ceil(docInfo.points / 2) : docInfo.points;
        await supabase.from('achievements').insert({
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: `${docInfo.label} Uploaded`,
          description: `Successfully uploaded ${docInfo.label}${isLate ? ' (Late)' : ''}`,
          points_awarded: pointsToAward,
          badge_color: '#8B5CF6',
          badge_icon: 'file'
        });
        toast.info(`You earned ${pointsToAward} points! ${isLate ? ' (Half points for late submission)' : ''}`);
      }
      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('');
      setUploadProgress(0);
      setUploadTarget(null);
      fetchDocuments();

      // Force refresh of timesheet schedules with a more robust approach
      // First, update the state immediately to reflect the change
      if (currentPeriodId) {
        setTimesheetSchedules(prevSchedules => 
          prevSchedules.map(schedule => 
            schedule.id === currentPeriodId 
              ? { ...schedule, work_timesheet_uploaded: true, uploaded_at: new Date().toISOString() } 
              : schedule
          )
        );
      }

      // Set upload completed flag to trigger the useEffect refresh
      setUploadCompleted(true);

      setIsUploadDialogOpen(false); // Close the dialog on success

      // Reset file input
      const fileInput = window.document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleTimesheetUploadClick = async (periodData: TimesheetSchedule | undefined, periodNum: number, month: number, year: number) => {
    console.log('handleTimesheetUploadClick called with:', { periodData, periodNum, month, year });
    
    // Set the upload target first
    setDocumentType('work_attendance_log');
    
    if (periodData) {
      setPendingUploadTarget({ periodId: periodData.id, type: 'work' });
      setIsUploadDialogOpen(true);
      console.log('Setting upload target to existing period:', periodData.id);
    } else {
      // Create the schedule entry if it doesn't exist
      try {
        console.log('Creating new schedule for:', { user_id: user!.id, target_month: month, target_year: year });
        // Call the existing function to create schedules for the whole month
        const { error } = await supabase.rpc('initialize_biweekly_timesheets', {
          user_id: user!.id,
          target_month: month,
          target_year: year
        });
        if (error) throw error;

        // Refetch schedules to get the newly created one
        const { data: newSchedules } = await supabase.from('timesheet_schedules').select('*').eq('learner_id', user!.id).eq('year', year).eq('month', month);
        const newPeriodData = newSchedules?.find(p => p.period === periodNum);
        console.log('New schedules fetched:', newSchedules);
        console.log('New period data found:', newPeriodData);

        if (newPeriodData) {
          setPendingUploadTarget({ periodId: newPeriodData.id, type: 'work' });
          setIsUploadDialogOpen(true);
          console.log('Setting upload target to new period:', newPeriodData.id);
        } else {
          throw new Error("Failed to find newly created schedule.");
        }
      
        // Update the selected year if it's different
        if (selectedYear !== year) {
          setSelectedYear(year);
          console.log('Updated selected year to:', year);
        }
      } catch (error: any) {
        console.error('Error in handleTimesheetUploadClick:', error);
        toast.error("Could not prepare upload slot. Please try again.");
      }
    }
  };

  const handleViewTimesheet = async (period: TimesheetSchedule) => {
    try {
      // Direct query using raw SQL since table is not in generated types
      const { data: submission, error: submissionError }: any = await (supabase as any)
        .from('timesheet_submissions')
        .select('file_path, file_name')
        .eq('schedule_id', period.id)
        .single();

      if (!submission || submissionError) {
        toast.error("Document not found.");
        return;
      }

      const { data, error } = await supabase.storage
        .from('office-documents')
        .download(submission.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error viewing timesheet:', err);
      toast.error("Could not load document.");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Handle CV downloads differently - they are stored as JSON in file_path
      if (doc.document_type === 'cv_upload') {
        try {
          const cvData = JSON.parse(doc.file_path);
          toast.info('CV PDF download functionality coming soon!');
          return;
        } catch (parseError) {
          // If parsing fails, treat as regular document
        }
      }

      // Get the appropriate bucket for this document type
      const bucketName = getBucketForDocumentType(doc.document_type);
      const {
        data,
        error
      } = await supabase.storage.from(bucketName).download(doc.file_path);
      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = doc.file_name;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };
  const handleDelete = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      // Handle CV deletion differently - they are stored as JSON in file_path
      if (doc.document_type === 'cv_upload') {
        try {
          const cvData = JSON.parse(doc.file_path);
          // Mark the CV as unpublished in the documents table
          const updatedCvData = {
            ...cvData,
            is_published: false
          };
          const {
            error
          } = await supabase.from('documents').update({
            file_path: JSON.stringify(updatedCvData)
          }).eq('id', doc.id);
          if (error) throw error;
          toast.success('CV unpublished successfully');
          fetchDocuments();
          return;
        } catch (parseError) {
          // If parsing fails, treat as regular document deletion
        }
      }

      // Get the appropriate bucket for this document type
      const bucketName = getBucketForDocumentType(doc.document_type);

      // Delete from storage
      const {
        error: storageError
      } = await supabase.storage.from(bucketName).remove([doc.file_path]);
      if (storageError) throw storageError;

      // Delete from database
      const {
        error: dbError
      } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getDocumentIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <File className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />;
      default:
        return <File className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />;
    }
  };
  const getDocumentsByCategory = (categoryKey: string) => {
    return documents.filter(doc => {
      const category = documentCategories[categoryKey as keyof typeof documentCategories];
      return category.documents.some(d => d.value === doc.document_type);
    });
  };
  const getDocumentLabel = (docType: string) => {
    const docInfo = getDocumentInfo(docType);
    return docInfo?.label || docType;
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : currentYear - 1;
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  const getMonthsForYear = (year: number) => {
    const months = [];
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();
    
    const registrationDate = profile?.created_at ? new Date(profile.created_at) : null;
    const registrationMonth = registrationDate ? registrationDate.getMonth() + 1 : 1;
    const registrationYear = registrationDate ? registrationDate.getFullYear() : year;

    for (let month = 1; month <= 12; month++) {
      if (year === currentYearNum && month > currentMonthNum) continue;
      if (year < registrationYear) continue;
      if (year === registrationYear && month < registrationMonth) continue;
      months.push(month);
    }
    return months;
  };

  const renderBiWeeklyTimesheets = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bi-Weekly Timesheet Submissions</CardTitle>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
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
            <CardDescription>
              Upload your bi-weekly work timesheets here. Two periods are required per month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getMonthsForYear(selectedYear).map(month => {
              const monthName = new Date(selectedYear, month - 1).toLocaleString('default', { month: 'long' });
              const periods = timesheetSchedules.filter(s => s.month === month && s.year === selectedYear);
              
              return (
                <div key={month} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{monthName} {selectedYear}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }, (_, i) => i + 1).map(periodNum => {
                      const periodData = periods.find(p => p.period === periodNum);
                      const dueDate = periodData?.due_date 
                        ? new Date(periodData.due_date) 
                        : new Date(selectedYear, month - 1, periodNum === 1 ? 15 : new Date(selectedYear, month, 0).getDate());

                      const isOverdue = dueDate < new Date() && !periodData?.work_timesheet_uploaded;

                      return (
                        <div key={periodNum} className={`p-3 rounded-md space-y-3 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border`}>
                          <h5 className="font-medium text-sm">Period {periodNum}/ S{periodNum} (Due: {dueDate.toLocaleDateString()})</h5>
                          
                          {/* Bi-weekly Timesheet */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Bi-weekly Timesheet</span>
                            <div className="flex items-center gap-2">
                              {periodData?.work_timesheet_uploaded && (
                                <Button size="sm" variant="outline" onClick={() => handleViewTimesheet(periodData)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Dialog 
                                open={isUploadDialogOpen && uploadTarget?.periodId === periodData?.id} 
                                onOpenChange={(open) => {
                                  setIsUploadDialogOpen(open);
                                  // Reset upload target when dialog closes
                                  if (!open) {
                                    // Add a small delay before resetting the upload target to ensure state updates properly
                                    setTimeout(() => {
                                      setUploadTarget(null);
                                    }, 100);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      handleTimesheetUploadClick(periodData, periodNum, month, selectedYear);
                                    }}
                                  >
                                    {periodData?.work_timesheet_uploaded ? 'Update' : 'Upload'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{periodData?.work_timesheet_uploaded ? 'Update' : 'Upload'} Bi-weekly Timesheet</DialogTitle>
                                  </DialogHeader>
                                  {renderUploadForm('work_attendance_log')}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          {isOverdue && (
                            <div className="flex items-center gap-2 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" /> <span>Submission is overdue.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderClassAttendance = () => {
    const classAttendanceDocs = documents.filter(doc => doc.document_type === 'class_attendance_proof');

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Upload Class Attendance</CardTitle>
            <CardDescription>Upload your signed class attendance sheets here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-attendance-upload">Select File *</Label>
                <Input id="class-attendance-upload" type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="rounded-xl border-gray-200" />
                <p className="text-xs text-gray-500">Supported formats: PDF, Word, Images (max 10MB)</p>
              </div>
              <Button 
                onClick={() => {
                  setDocumentType('class_attendance_proof');
                  handleUpload();
                }} 
                disabled={!selectedFile || loading} 
                className="w-full"
              >
                {loading ? 'Uploading...' : 'Upload Class Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Class Attendance Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            {classAttendanceDocs.length === 0 ? (
              <p className="text-muted-foreground text-center">No class attendance sheets uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {classAttendanceDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getDocumentIcon(doc.file_name)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate text-sm">{doc.file_name}</h4>
                        <div className="text-xs text-gray-600">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="mx-2">•</span>
                          <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(doc)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderUploadForm = (docType: string) => (
    <div className="space-y-4 p-4">
      <Input type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
      <Button onClick={handleUpload} disabled={!selectedFile || loading} className="w-full">
        {loading ? 'Uploading...' : 'Confirm Upload'}
      </Button>
    </div>
  );

  const renderCategoryTab = (categoryKey: keyof typeof documentCategories) => {
    if (categoryKey === 'office') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Submissions</CardTitle>
            <CardDescription>Manage your bi-weekly and class attendance timesheets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bi-weekly">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bi-weekly">Bi-weekly Timesheets</TabsTrigger>
                <TabsTrigger value="classes">Class Attendance</TabsTrigger>
              </TabsList>
              <TabsContent value="bi-weekly" className="mt-4">{renderBiWeeklyTimesheets()}</TabsContent>
              <TabsContent value="classes" className="mt-4">{renderClassAttendance()}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      );
    }

    const category = documentCategories[categoryKey];
    const categoryDocs = getDocumentsByCategory(categoryKey);

    return (
      <div className="space-y-6">
        {/* Upload Section for the category */}
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-[#122ec0]" />
              <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
                Upload to {category.title}
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 text-sm sm:text-base">
              Upload your documents for this category.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 px-[8px]">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`document-type-${categoryKey}`} className="text-sm sm:text-base">Document Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {category.documents.map(doc => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`file-upload-${categoryKey}`} className="text-sm sm:text-base">Select File *</Label>
                    <Input id={`file-upload-${categoryKey}`} type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="rounded-xl border-gray-200" />
                    <p className="text-xs text-gray-500">
                      Supported formats: PDF, Word documents, Images (max 10MB)
                    </p>
                  </div>

                  {selectedFile && documentCategories[categoryKey].documents.some(d => d.value === documentType) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        {getDocumentIcon(selectedFile.name)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-blue-800 truncate">{selectedFile.name}</p>
                          <p className="text-sm text-blue-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleUpload} disabled={!selectedFile || !documentType || loading || !documentCategories[categoryKey].documents.some(d => d.value === documentType)} className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                {loading ? 'Uploading...' : (
                  <>
                    <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List for the category */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">{category.icon}</span>
              <span>Uploaded in {category.title}</span>
              <span className="text-sm sm:text-base text-gray-500">({categoryDocs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {categoryDocs.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No {category.title.toLowerCase()}</h3>
                <p className="text-gray-500 text-sm sm:text-base">Upload your first document in this category</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {categoryDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {getDocumentIcon(doc.file_name)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate text-sm sm:text-base">
                          {doc.file_name}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                          <span className="capitalize font-medium">
                            {doc.document_type === 'cv_upload' ? 'CV' : getDocumentLabel(doc.document_type)}
                          </span>
                          {doc.file_size > 0 && <span>{formatFileSize(doc.file_size)}</span>}
                          <span>{doc.document_type === 'cv_upload' ? 'Published' : 'Uploaded'}: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} className="rounded-lg p-2">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(doc)} className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 p-2">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category-specific Guidelines */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center space-x-2 text-yellow-800 text-base">
              <AlertCircle className="h-5 w-5" />
              <span>Guidelines for {category.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700 p-4 pt-0 text-sm">
            <ul className="space-y-1 list-disc list-inside">
              {categoryKey as string === 'personal' && (
                <>
                  <li>Submit certified copies of all personal documents.</li>
                  <li>Qualifications must be certified by SAQA or relevant authority.</li>
                  <li>Bank account proof should be recent (within 3 months).</li>
                </>
              )}
              {categoryKey as string === 'office' && (
                <>
                  <li>Submit bi-weekly attendance records as required.</li>
                  <li>Time sheets must be signed by your supervisor.</li>
                </>
              )}
              {categoryKey as string === 'contracts' && (
                <>
                  <li>All contract documents must be fully completed and signed.</li>
                  <li>The POPIA form is mandatory for all learners.</li>
                </>
              )}
              <li>Maximum file size is 10MB.</li>
              <li>Accepted formats: PDF, Word, Images (JPG, PNG).</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  return <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0 px-0">
      <Tabs defaultValue="office" className="w-full" onValueChange={() => setUploadTarget(null)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="office">{documentCategories.office.icon} {documentCategories.office.title}</TabsTrigger>
          <TabsTrigger value="personal">{documentCategories.personal.icon} {documentCategories.personal.title}</TabsTrigger>
          <TabsTrigger value="contracts">{documentCategories.contracts.icon} {documentCategories.contracts.title}</TabsTrigger>
        </TabsList>
        <TabsContent value="office" className="mt-6">
          {renderCategoryTab('office')}
        </TabsContent>
        <TabsContent value="personal" className="mt-6">
          {renderCategoryTab('personal')}
        </TabsContent>
        <TabsContent value="contracts" className="mt-6">
          {renderCategoryTab('contracts')}
        </TabsContent>
      </Tabs>
    </div>;
};
export default DocumentUpload;