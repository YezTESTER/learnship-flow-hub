import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Plus, Trash2, User, Award, Briefcase, GraduationCap, Eye, Edit, Save, Upload, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ModernCVPreview from './ModernCVPreview';
import { PDFDownloadDialog } from './PDFDownloadDialog';
import { CVTemplate } from '@/lib/pdfGenerator';
export interface CVData {
  id?: string;
  title: string;
  is_published: boolean;
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    id_number: string;
    date_of_birth: string;
    nationality: string;
    gender: string;
    race: string;
    languages: string[];
    avatar_url: string;
    area_of_residence: string;
    has_disability: boolean;
    disability_description: string;
    has_drivers_license: boolean;
    license_codes: string[];
    has_own_transport: boolean;
    public_transport_types: string[];
  };
  education: {
    id: string;
    institution: string;
    qualification: string;
    year: string;
  }[];
  experience: {
    id: string;
    position: string;
    company: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    responsibilities: {
      id: string;
      heading: string;
      description: string;
    }[];
  }[];
  skills: string[];
  references: {
    name: string;
    position: string;
    company: string;
    phone: string;
    email: string;
  }[];
}
const CVBuilder = () => {
  const {
    user,
    profile
  } = useAuth();
  const {
    setHasUnsavedChanges
  } = useUnsavedChanges();
  const [loading, setLoading] = useState(false);
  const [cvList, setCvList] = useState<CVData[]>([]);
  const [currentCV, setCurrentCV] = useState<CVData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [localHasUnsavedChanges, setLocalHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [selectedCVForPDF, setSelectedCVForPDF] = useState<CVData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<CVTemplate>('basic');
  const defaultCVData: CVData = {
    title: 'My CV',
    is_published: false,
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      id_number: '',
      date_of_birth: '',
      nationality: 'South African',
      gender: '',
      race: '',
      languages: ['English'],
      avatar_url: '',
      area_of_residence: '',
      has_disability: false,
      disability_description: '',
      has_drivers_license: false,
      license_codes: [],
      has_own_transport: false,
      public_transport_types: []
    },
    education: [],
    experience: [],
    skills: [],
    references: []
  };
  useEffect(() => {
    if (profile && user) {
      const updatedPersonalInfo = {
        full_name: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone_number || '',
        address: profile.address || '',
        id_number: profile.id_number || '',
        date_of_birth: profile.date_of_birth || '',
        nationality: profile.nationality || 'South African',
        gender: profile.gender || '',
        race: profile.race || '',
        languages: profile.languages || ['English'],
        avatar_url: profile.avatar_url || '',
        area_of_residence: profile.area_of_residence || '',
        has_disability: profile.has_disability || false,
        disability_description: profile.disability_description || '',
        has_drivers_license: profile.has_drivers_license || false,
        license_codes: profile.license_codes || [],
        has_own_transport: profile.has_own_transport || false,
        public_transport_types: profile.public_transport_types || []
      };
      setCurrentCV(prev => prev ? {
        ...prev,
        personal_info: updatedPersonalInfo
      } : {
        ...defaultCVData,
        personal_info: updatedPersonalInfo
      });
      loadCVs();
    }
  }, [profile, user]);

  // Track changes to show unsaved warning
  useEffect(() => {
    if (isEditing && currentCV) {
      setLocalHasUnsavedChanges(true);
      setHasUnsavedChanges(true);
    }
  }, [currentCV, isEditing, setHasUnsavedChanges]);

  // Reset unsaved changes when component unmounts or user saves
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);
  const loadCVs = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('documents').select('*').eq('learner_id', user.id).eq('document_type', 'other').like('file_name', 'cv_%');
      if (error) throw error;
      const cvs = data.map(doc => {
        try {
          return JSON.parse(doc.file_path) as CVData;
        } catch {
          return null;
        }
      }).filter(Boolean) as CVData[];
      setCvList(cvs);
    } catch (error: any) {
      console.error('Error loading CVs:', error);
    }
  };
  const checkDuplicateTitle = (title: string, excludeId?: string) => {
    return cvList.some(cv => cv.title.toLowerCase() === title.toLowerCase() && cv.id !== excludeId);
  };
  const handleUnsavedAction = (action: () => void) => {
    if (localHasUnsavedChanges) {
      setPendingAction(() => action);
      setShowUnsavedWarning(true);
    } else {
      action();
    }
  };
  const createNewCV = () => {
    const action = () => {
      const newCV = {
        ...defaultCVData,
        id: Date.now().toString(),
        title: `CV ${cvList.length + 1}`,
        personal_info: {
          ...defaultCVData.personal_info,
          full_name: profile?.full_name || '',
          email: user?.email || '',
          phone: profile?.phone_number || '',
          address: profile?.address || '',
          id_number: profile?.id_number || '',
          date_of_birth: profile?.date_of_birth || '',
          nationality: profile?.nationality || 'South African',
          gender: profile?.gender || '',
          race: profile?.race || '',
          languages: profile?.languages || ['English'],
          avatar_url: profile?.avatar_url || '',
          area_of_residence: profile?.area_of_residence || '',
          has_disability: profile?.has_disability || false,
          disability_description: profile?.disability_description || '',
          has_drivers_license: profile?.has_drivers_license || false,
          license_codes: profile?.license_codes || [],
          has_own_transport: profile?.has_own_transport || false,
          public_transport_types: profile?.public_transport_types || []
        }
      };
      setCurrentCV(newCV);
      setIsEditing(true);
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    };
    handleUnsavedAction(action);
  };
  const editCV = (cv: CVData) => {
    const action = () => {
      setCurrentCV(cv);
      setIsEditing(true);
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    };
    handleUnsavedAction(action);
  };
  const saveCV = async () => {
    if (!user || !currentCV) return;

    // Check for duplicate title
    if (checkDuplicateTitle(currentCV.title, currentCV.id)) {
      setShowDuplicateWarning(true);
      return;
    }
    setLoading(true);
    try {
      const cvId = currentCV.id || Date.now().toString();
      const fileName = `cv_${cvId}.json`;
      const {
        error
      } = await supabase.from('documents').upsert({
        learner_id: user.id,
        document_type: 'other',
        file_name: fileName,
        file_path: JSON.stringify({
          ...currentCV,
          id: cvId
        }),
        submission_id: null
      });
      if (error) throw error;
      toast.success('CV saved successfully!');
      setIsEditing(false);
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
      loadCVs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save CV');
    } finally {
      setLoading(false);
    }
  };
  const publishCV = async (cvId: string) => {
    if (!user) return;
    try {
      const cv = cvList.find(c => c.id === cvId);
      if (!cv) return;
      const updatedCV = {
        ...cv,
        is_published: !cv.is_published
      };
      const fileName = `cv_${cvId}.json`;
      const {
        error
      } = await supabase.from('documents').update({
        file_path: JSON.stringify(updatedCV)
      }).eq('learner_id', user.id).eq('file_name', fileName);
      if (error) throw error;
      toast.success(updatedCV.is_published ? 'CV published successfully!' : 'CV unpublished successfully!');
      loadCVs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update CV');
    }
  };
  const deleteCV = async (cvId: string) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('documents').delete().eq('learner_id', user.id).eq('file_name', `cv_${cvId}.json`);
      if (error) throw error;
      toast.success('CV deleted successfully!');
      loadCVs();
      if (currentCV?.id === cvId) {
        setCurrentCV(null);
        setIsEditing(false);
        setLocalHasUnsavedChanges(false);
        setHasUnsavedChanges(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete CV');
    }
  };
  const addEducation = () => {
    if (!currentCV) return;
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      qualification: '',
      year: ''
    };
    setCurrentCV({
      ...currentCV,
      education: [...currentCV.education, newEdu]
    });
  };
  const addExperience = () => {
    if (!currentCV) return;
    const newExp = {
      id: Date.now().toString(),
      position: '',
      company: '',
      start_date: '',
      end_date: '',
      is_current: false,
      responsibilities: []
    };
    setCurrentCV({
      ...currentCV,
      experience: [...currentCV.experience, newExp]
    });
  };
  const addResponsibility = (expIndex: number) => {
    if (!currentCV) return;
    const newResponsibility = {
      id: Date.now().toString(),
      heading: '',
      description: ''
    };
    const updatedExperience = [...currentCV.experience];
    updatedExperience[expIndex].responsibilities.push(newResponsibility);
    setCurrentCV({
      ...currentCV,
      experience: updatedExperience
    });
  };
  const addSkill = () => {
    if (!currentCV) return;
    setCurrentCV({
      ...currentCV,
      skills: [...currentCV.skills, '']
    });
  };
  const addReference = () => {
    if (!currentCV) return;
    const newRef = {
      name: '',
      position: '',
      company: '',
      phone: '',
      email: ''
    };
    setCurrentCV({
      ...currentCV,
      references: [...currentCV.references, newRef]
    });
  };
  const CVPreview = ({
    cv
  }: {
    cv: CVData;
  }) => {
    return <div className="w-full">
        <ModernCVPreview cv={cv} />
      </div>;
  };
  if (showPreview && currentCV) {
    return <div className="max-w-6xl ml-0 space-y-3 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
          <h1 className="text-base sm:text-lg font-medium bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            CV Preview: {currentCV.title}
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button onClick={() => setShowPreview(false)} variant="outline" className="text-xs px-3 py-1.5">
              Back to Edit
            </Button>
          </div>
        </div>
        <div className="w-full">
          <CVPreview cv={currentCV} />
        </div>
      </div>;
  }
  if (!isEditing) {
    return <div className="max-w-6xl mx-auto space-y-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            My CVs
          </h1>
          <Button onClick={createNewCV} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] text-sm w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create New CV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cvList.map(cv => <Card key={cv.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  {cv.title}
                  {cv.is_published && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Published</span>}
                </CardTitle>
                <CardDescription className="text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => editCV(cv)} variant="outline" className="w-full text-sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit CV
                </Button>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button onClick={() => {
                setCurrentCV(cv);
                setShowPreview(true);
              }} variant="outline" className="flex-1 text-sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={() => {
                setSelectedCVForPDF(cv);
                setShowPDFDialog(true);
              }} variant="outline" className="flex-1 text-sm">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <Button onClick={() => cv.id && publishCV(cv.id)} variant={cv.is_published ? "secondary" : "default"} className="w-full text-sm">
                  <Upload className="mr-2 h-4 w-4" />
                  {cv.is_published ? 'Unpublish CV' : 'Publish CV'}
                </Button>
                <Button onClick={() => cv.id && deleteCV(cv.id)} variant="destructive" size="sm" className="w-full text-sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>)}
        </div>

        {cvList.length === 0 && <div className="text-center py-8 sm:py-12">
            <FileText className="h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">No CVs Created Yet</h2>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">Create your first CV to get started</p>
            <Button onClick={createNewCV} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First CV
            </Button>
          </div>}

        {/* Unsaved Changes Warning Dialog */}
        <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Do you want to continue without saving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>
                Cancel
              </AlertDialogCancel>
               <AlertDialogAction onClick={() => {
              setShowUnsavedWarning(false);
              setLocalHasUnsavedChanges(false);
              setHasUnsavedChanges(false);
              if (pendingAction) {
                pendingAction();
                setPendingAction(null);
              }
            }}>
                Continue without saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Duplicate Title Warning Dialog */}
        <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Duplicate CV Title
              </AlertDialogTitle>
              <AlertDialogDescription>
                A CV with this title already exists. Please choose a different title.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowDuplicateWarning(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>;
  }
  return <div className="max-w-6xl mx-auto space-y-4 sm:px-6 px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
          {currentCV?.id ? 'Edit CV' : 'Create New CV'}
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button onClick={() => currentCV && setShowPreview(true)} variant="outline" className="text-sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveCV} disabled={loading} className="text-sm">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save CV'}
          </Button>
          <Button onClick={() => handleUnsavedAction(() => setIsEditing(false))} variant="outline" className="text-sm">
            Back to List
          </Button>
        </div>
      </div>

      {currentCV && <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg mx-0">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Label className="text-sm">CV Title</Label>
              <Input value={currentCV.title} onChange={e => setCurrentCV({
            ...currentCV,
            title: e.target.value
          })} className="rounded-xl border-gray-200 text-sm" placeholder="Enter CV title" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 px-0 py-0 mx-0 bg-transparent">
            {/* Personal Information - Editable */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Name</Label>
                  <Input value={currentCV.personal_info.full_name} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  full_name: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input value={currentCV.personal_info.email} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  email: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone</Label>
                  <Input value={currentCV.personal_info.phone} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  phone: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">ID Number</Label>
                  <Input value={currentCV.personal_info.id_number} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  id_number: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Date of Birth</Label>
                  <Input type="date" value={currentCV.personal_info.date_of_birth} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  date_of_birth: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Gender</Label>
                  <Input value={currentCV.personal_info.gender} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  gender: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Race</Label>
                  <Input value={currentCV.personal_info.race} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  race: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Nationality</Label>
                  <Input value={currentCV.personal_info.nationality} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  nationality: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm">Address</Label>
                  <Textarea value={currentCV.personal_info.address} onChange={e => setCurrentCV({
                ...currentCV,
                personal_info: {
                  ...currentCV.personal_info,
                  address: e.target.value
                }
              })} className="rounded-xl border-gray-200 text-sm" rows={2} />
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 px-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Experience
                </h3>
              </div>
              {currentCV.experience.map((exp, index) => <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4 px-[12px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Position</Label>
                      <Input value={exp.position} onChange={e => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].position = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Company</Label>
                      <Input value={exp.company} onChange={e => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].company = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Start Date</Label>
                      <Input type="date" value={exp.start_date} onChange={e => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].start_date = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">End Date</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" checked={exp.is_current} onChange={e => {
                      const newExperience = [...currentCV.experience];
                      newExperience[index].is_current = e.target.checked;
                      if (e.target.checked) {
                        newExperience[index].end_date = '';
                      }
                      setCurrentCV({
                        ...currentCV,
                        experience: newExperience
                      });
                    }} className="rounded" />
                          <Label className="text-sm">Currently working here</Label>
                        </div>
                        {!exp.is_current && <Input type="date" value={exp.end_date} onChange={e => {
                    const newExperience = [...currentCV.experience];
                    newExperience[index].end_date = e.target.value;
                    setCurrentCV({
                      ...currentCV,
                      experience: newExperience
                    });
                  }} className="rounded-xl border-gray-200 text-sm" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Key Responsibilities</Label>
                      <Button type="button" onClick={() => addResponsibility(index)} variant="outline" size="sm" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Responsibility
                      </Button>
                    </div>
                    {exp.responsibilities.map((resp, respIndex) => <div key={resp.id} className="border border-gray-100 rounded p-3 space-y-2">
                        <Input value={resp.heading} onChange={e => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].responsibilities[respIndex].heading = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} className="rounded-xl border-gray-200 text-sm" placeholder="Responsibility heading" />
                        <Textarea value={resp.description} onChange={e => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].responsibilities[respIndex].description = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} className="rounded-xl border-gray-200 text-sm" placeholder="Responsibility description" rows={2} />
                        <Button onClick={() => {
                  const newExperience = [...currentCV.experience];
                  newExperience[index].responsibilities = newExperience[index].responsibilities.filter((_, i) => i !== respIndex);
                  setCurrentCV({
                    ...currentCV,
                    experience: newExperience
                  });
                }} variant="destructive" size="sm" className="text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>)}
                  </div>
                  
                  <Button onClick={() => {
              const newExperience = currentCV.experience.filter((_, i) => i !== index);
              setCurrentCV({
                ...currentCV,
                experience: newExperience
              });
            }} variant="destructive" size="sm" className="mt-2 text-sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Experience
                  </Button>
                </div>)}
              <Button onClick={addExperience} variant="outline" size="sm" className="text-sm w-full sm:w-auto px-[2px] mx-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {/* Education Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Education
                </h3>
              </div>
              {currentCV.education.map((edu, index) => <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Institution</Label>
                      <Input value={edu.institution} onChange={e => {
                  const newEducation = [...currentCV.education];
                  newEducation[index].institution = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    education: newEducation
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Qualification</Label>
                      <Input value={edu.qualification} onChange={e => {
                  const newEducation = [...currentCV.education];
                  newEducation[index].qualification = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    education: newEducation
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year</Label>
                      <Input value={edu.year} onChange={e => {
                  const newEducation = [...currentCV.education];
                  newEducation[index].year = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    education: newEducation
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                  </div>
                  <Button onClick={() => {
              const newEducation = currentCV.education.filter((_, i) => i !== index);
              setCurrentCV({
                ...currentCV,
                education: newEducation
              });
            }} variant="destructive" size="sm" className="mt-2 text-sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>)}
              <Button onClick={addEducation} variant="outline" size="sm" className="text-sm w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>

            {/* Skills Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Skills
                </h3>
              </div>
              <div className="space-y-2">
                {currentCV.skills.map((skill, index) => <div key={index} className="flex items-center space-x-2">
                    <Input value={skill} onChange={e => {
                const newSkills = [...currentCV.skills];
                newSkills[index] = e.target.value;
                setCurrentCV({
                  ...currentCV,
                  skills: newSkills
                });
              }} className="rounded-xl border-gray-200 text-sm" placeholder="Enter skill" />
                    <Button onClick={() => {
                const newSkills = currentCV.skills.filter((_, i) => i !== index);
                setCurrentCV({
                  ...currentCV,
                  skills: newSkills
                });
              }} variant="destructive" size="sm" className="text-sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>
              <Button onClick={addSkill} variant="outline" size="sm" className="text-sm w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>

            {/* References Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">References</h3>
              </div>
              {currentCV.references.map((ref, index) => <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Name</Label>
                      <Input value={ref.name} onChange={e => {
                  const newReferences = [...currentCV.references];
                  newReferences[index].name = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    references: newReferences
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Position</Label>
                      <Input value={ref.position} onChange={e => {
                  const newReferences = [...currentCV.references];
                  newReferences[index].position = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    references: newReferences
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Company</Label>
                      <Input value={ref.company} onChange={e => {
                  const newReferences = [...currentCV.references];
                  newReferences[index].company = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    references: newReferences
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Phone</Label>
                      <Input value={ref.phone} onChange={e => {
                  const newReferences = [...currentCV.references];
                  newReferences[index].phone = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    references: newReferences
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Input value={ref.email} onChange={e => {
                  const newReferences = [...currentCV.references];
                  newReferences[index].email = e.target.value;
                  setCurrentCV({
                    ...currentCV,
                    references: newReferences
                  });
                }} className="rounded-xl border-gray-200 text-sm" />
                    </div>
                  </div>
                  <Button onClick={() => {
              const newReferences = currentCV.references.filter((_, i) => i !== index);
              setCurrentCV({
                ...currentCV,
                references: newReferences
              });
            }} variant="destructive" size="sm" className="mt-2 text-sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>)}
              <Button onClick={addReference} variant="outline" size="sm" className="text-sm w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Save Button at Bottom */}
      {isEditing && <div className="flex justify-center pb-8">
          <Button onClick={saveCV} disabled={loading} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white px-8 py-3 text-lg font-semibold rounded-xl">
            {loading ? 'Saving...' : <>
                <Save className="mr-2 h-5 w-5" />
                Save CV
              </>}
          </Button>
        </div>}

      {/* Warning Dialogs */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to continue without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            setShowUnsavedWarning(false);
            setLocalHasUnsavedChanges(false);
            setHasUnsavedChanges(false);
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }}>
              Continue without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Duplicate CV Title
            </AlertDialogTitle>
            <AlertDialogDescription>
              A CV with this title already exists. Please choose a different title.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDuplicateWarning(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Download Dialog */}
      {selectedCVForPDF && <PDFDownloadDialog open={showPDFDialog} onOpenChange={setShowPDFDialog} cv={selectedCVForPDF} currentTemplate={currentTemplate} />}
    </div>;
};
export default CVBuilder;