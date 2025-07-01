
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Plus, Trash2, User, Award, Briefcase, GraduationCap, Eye, Edit, Save } from 'lucide-react';

interface CVData {
  id?: string;
  title: string;
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    id_number: string;
    date_of_birth: string;
    nationality: string;
    gender: string;
    languages: string[];
    avatar_url: string;
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
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cvList, setCvList] = useState<CVData[]>([]);
  const [currentCV, setCurrentCV] = useState<CVData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const defaultCVData: CVData = {
    title: 'My CV',
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      id_number: '',
      date_of_birth: '',
      nationality: 'South African',
      gender: '',
      languages: ['English'],
      avatar_url: ''
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
        nationality: 'South African',
        gender: '',
        languages: ['English'],
        avatar_url: profile.avatar_url || ''
      };
      
      setCurrentCV(prev => prev ? { ...prev, personal_info: updatedPersonalInfo } : { ...defaultCVData, personal_info: updatedPersonalInfo });
      loadCVs();
    }
  }, [profile, user]);

  const loadCVs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('learner_id', user.id)
        .eq('document_type', 'other')
        .like('file_name', 'cv_%');

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

  const createNewCV = () => {
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
        avatar_url: profile?.avatar_url || ''
      }
    };
    setCurrentCV(newCV);
    setIsEditing(true);
  };

  const editCV = (cv: CVData) => {
    setCurrentCV(cv);
    setIsEditing(true);
  };

  const saveCV = async () => {
    if (!user || !currentCV) return;
    
    setLoading(true);
    try {
      const cvId = currentCV.id || Date.now().toString();
      const fileName = `cv_${cvId}.json`;
      
      const { error } = await supabase
        .from('documents')
        .upsert({
          learner_id: user.id,
          document_type: 'other',
          file_name: fileName,
          file_path: JSON.stringify({ ...currentCV, id: cvId }),
          submission_id: null
        });

      if (error) throw error;
      
      toast.success('CV saved successfully!');
      setIsEditing(false);
      loadCVs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save CV');
    } finally {
      setLoading(false);
    }
  };

  const deleteCV = async (cvId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('learner_id', user.id)
        .eq('file_name', `cv_${cvId}.json`);

      if (error) throw error;
      
      toast.success('CV deleted successfully!');
      loadCVs();
      if (currentCV?.id === cvId) {
        setCurrentCV(null);
        setIsEditing(false);
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

  const CVPreview = ({ cv }: { cv: CVData }) => (
    <div className="bg-white p-4 sm:p-8 max-w-4xl mx-auto" style={{ minHeight: '297mm', width: '210mm' }}>
      {/* Header with photo and contact info */}
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6 border-b pb-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
          {cv.personal_info.avatar_url ? (
            <img src={cv.personal_info.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{cv.personal_info.full_name}</h1>
          <div className="text-gray-600 space-y-1 text-sm sm:text-base">
            <p>{cv.personal_info.email} | {cv.personal_info.phone}</p>
            <p>{cv.personal_info.address}</p>
            <p>ID: {cv.personal_info.id_number} | DOB: {cv.personal_info.date_of_birth}</p>
            <p>Nationality: {cv.personal_info.nationality} | Languages: {cv.personal_info.languages.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Education */}
      {cv.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Education</h2>
          {cv.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <h3 className="font-semibold text-sm sm:text-base">{edu.qualification}</h3>
              <p className="text-gray-600 text-sm">{edu.institution} - {edu.year}</p>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {cv.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Experience</h2>
          {cv.experience.map((exp, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-semibold text-sm sm:text-base">{exp.position}</h3>
              <p className="text-gray-600 mb-2 text-sm">{exp.company} - {exp.start_date} to {exp.is_current ? 'Present' : exp.end_date}</p>
              {exp.responsibilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Key Responsibilities:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {exp.responsibilities.map((resp, i) => (
                      <li key={i}>
                        <strong>{resp.heading}:</strong> {resp.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {cv.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {cv.skills.filter(skill => skill.trim()).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {cv.references.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">References</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cv.references.map((ref, index) => (
              <div key={index} className="text-xs sm:text-sm">
                <h3 className="font-semibold">{ref.name}</h3>
                <p className="text-gray-600">{ref.position} at {ref.company}</p>
                <p className="text-gray-600">{ref.phone} | {ref.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (showPreview && currentCV) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            CV Preview: {currentCV.title}
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button onClick={() => toast.info('PDF download coming soon!')} className="bg-green-600 hover:bg-green-700 text-sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={() => setShowPreview(false)} variant="outline" className="text-sm">
              Back to Edit
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <CVPreview cv={currentCV} />
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 px-4 sm:px-6">
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
          {cvList.map((cv) => (
            <Card key={cv.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{cv.title}</CardTitle>
                <CardDescription className="text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => editCV(cv)} variant="outline" className="w-full text-sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit CV
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      setCurrentCV(cv);
                      setShowPreview(true);
                    }} 
                    variant="outline" 
                    className="flex-1 text-sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={() => toast.info('PDF download coming soon!')} variant="outline" className="flex-1 text-sm">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
                <Button 
                  onClick={() => cv.id && deleteCV(cv.id)} 
                  variant="destructive" 
                  size="sm"
                  className="w-full text-sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {cvList.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <FileText className="h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">No CVs Created Yet</h2>
            <p className="text-gray-500 mb-4 text-sm sm:text-base">Create your first CV to get started</p>
            <Button onClick={createNewCV} className="bg-gradient-to-r from-[#122ec0] to-[#e16623] text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First CV
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 px-4 sm:px-6">
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
          <Button onClick={() => setIsEditing(false)} variant="outline" className="text-sm">
            Back to List
          </Button>
        </div>
      </div>

      {currentCV && (
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Label className="text-sm">CV Title</Label>
              <Input
                value={currentCV.title}
                onChange={(e) => setCurrentCV({ ...currentCV, title: e.target.value })}
                className="rounded-xl border-gray-200 text-sm"
                placeholder="Enter CV title"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            {/* Personal Information - Auto-filled */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Personal Information (Auto-filled from Profile)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <p><strong>Name:</strong> {currentCV.personal_info.full_name}</p>
                <p><strong>Email:</strong> {currentCV.personal_info.email}</p>
                <p><strong>Phone:</strong> {currentCV.personal_info.phone}</p>
                <p><strong>ID Number:</strong> {currentCV.personal_info.id_number}</p>
                <p><strong>Date of Birth:</strong> {currentCV.personal_info.date_of_birth}</p>
                <p className="sm:col-span-2"><strong>Address:</strong> {currentCV.personal_info.address}</p>
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Experience
                </h3>
                <Button onClick={addExperience} variant="outline" size="sm" className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
              {currentCV.experience.map((exp, index) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Position</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].position = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].company = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Start Date</Label>
                      <Input
                        type="date"
                        value={exp.start_date}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].start_date = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">End Date</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exp.is_current}
                            onChange={(e) => {
                              const newExperience = [...currentCV.experience];
                              newExperience[index].is_current = e.target.checked;
                              if (e.target.checked) {
                                newExperience[index].end_date = '';
                              }
                              setCurrentCV({ ...currentCV, experience: newExperience });
                            }}
                            className="rounded"
                          />
                          <Label className="text-sm">Currently working here</Label>
                        </div>
                        {!exp.is_current && (
                          <Input
                            type="date"
                            value={exp.end_date}
                            onChange={(e) => {
                              const newExperience = [...currentCV.experience];
                              newExperience[index].end_date = e.target.value;
                              setCurrentCV({ ...currentCV, experience: newExperience });
                            }}
                            className="rounded-xl border-gray-200 text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Key Responsibilities</Label>
                      <Button
                        type="button"
                        onClick={() => addResponsibility(index)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Responsibility
                      </Button>
                    </div>
                    {exp.responsibilities.map((resp, respIndex) => (
                      <div key={resp.id} className="border border-gray-100 rounded p-3 space-y-2">
                        <Input
                          value={resp.heading}
                          onChange={(e) => {
                            const newExperience = [...currentCV.experience];
                            newExperience[index].responsibilities[respIndex].heading = e.target.value;
                            setCurrentCV({ ...currentCV, experience: newExperience });
                          }}
                          className="rounded-xl border-gray-200 text-sm"
                          placeholder="Responsibility heading"
                        />
                        <Textarea
                          value={resp.description}
                          onChange={(e) => {
                            const newExperience = [...currentCV.experience];
                            newExperience[index].responsibilities[respIndex].description = e.target.value;
                            setCurrentCV({ ...currentCV, experience: newExperience });
                          }}
                          className="rounded-xl border-gray-200 text-sm"
                          placeholder="Responsibility description"
                          rows={2}
                        />
                        <Button
                          onClick={() => {
                            const newExperience = [...currentCV.experience];
                            newExperience[index].responsibilities = newExperience[index].responsibilities.filter((_, i) => i !== respIndex);
                            setCurrentCV({ ...currentCV, experience: newExperience });
                          }}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => {
                      const newExperience = currentCV.experience.filter((_, i) => i !== index);
                      setCurrentCV({ ...currentCV, experience: newExperience });
                    }}
                    variant="destructive"
                    size="sm"
                    className="mt-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Experience
                  </Button>
                </div>
              ))}
            </div>

            {/* Education Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Education
                </h3>
                <Button onClick={addEducation} variant="outline" size="sm" className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </div>
              {currentCV.education.map((edu, index) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].institution = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Qualification</Label>
                      <Input
                        value={edu.qualification}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].qualification = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].year = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const newEducation = currentCV.education.filter((_, i) => i !== index);
                      setCurrentCV({ ...currentCV, education: newEducation });
                    }}
                    variant="destructive"
                    size="sm"
                    className="mt-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Skills Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Skills
                </h3>
                <Button onClick={addSkill} variant="outline" size="sm" className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>
              <div className="space-y-2">
                {currentCV.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...currentCV.skills];
                        newSkills[index] = e.target.value;
                        setCurrentCV({ ...currentCV, skills: newSkills });
                      }}
                      className="rounded-xl border-gray-200 text-sm"
                      placeholder="Enter skill"
                    />
                    <Button
                      onClick={() => {
                        const newSkills = currentCV.skills.filter((_, i) => i !== index);
                        setCurrentCV({ ...currentCV, skills: newSkills });
                      }}
                      variant="destructive"
                      size="sm"
                      className="text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* References Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">References</h3>
                <Button onClick={addReference} variant="outline" size="sm" className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </div>
              {currentCV.references.map((ref, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Name</Label>
                      <Input
                        value={ref.name}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].name = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Position</Label>
                      <Input
                        value={ref.position}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].position = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Company</Label>
                      <Input
                        value={ref.company}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].company = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Phone</Label>
                      <Input
                        value={ref.phone}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].phone = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Input
                        value={ref.email}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].email = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const newReferences = currentCV.references.filter((_, i) => i !== index);
                      setCurrentCV({ ...currentCV, references: newReferences });
                    }}
                    variant="destructive"
                    size="sm"
                    className="mt-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CVBuilder;
