
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
    duration: string;
    responsibilities: string[];
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
      duration: '',
      responsibilities: ['']
    };
    setCurrentCV({
      ...currentCV,
      experience: [...currentCV.experience, newExp]
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
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ minHeight: '297mm', width: '210mm' }}>
      {/* Header with photo and contact info */}
      <div className="flex items-start space-x-6 mb-6 border-b pb-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {cv.personal_info.avatar_url ? (
            <img src={cv.personal_info.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{cv.personal_info.full_name}</h1>
          <div className="text-gray-600 space-y-1">
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
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Education</h2>
          {cv.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <h3 className="font-semibold">{edu.qualification}</h3>
              <p className="text-gray-600">{edu.institution} - {edu.year}</p>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {cv.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Experience</h2>
          {cv.experience.map((exp, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-semibold">{exp.position}</h3>
              <p className="text-gray-600 mb-2">{exp.company} - {exp.duration}</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {exp.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {cv.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {cv.skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {cv.references.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">References</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cv.references.map((ref, index) => (
              <div key={index} className="text-sm">
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            CV Preview: {currentCV.title}
          </h1>
          <div className="space-x-2">
            <Button onClick={() => toast.info('PDF download coming soon!')} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Back to Edit
            </Button>
          </div>
        </div>
        <CVPreview cv={currentCV} />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
            My CVs
          </h1>
          <Button onClick={createNewCV} className="bg-gradient-to-r from-[#122ec0] to-[#e16623]">
            <Plus className="mr-2 h-4 w-4" />
            Create New CV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvList.map((cv) => (
            <Card key={cv.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{cv.title}</CardTitle>
                <CardDescription>
                  Last updated: {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => editCV(cv)} variant="outline" className="w-full">
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
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button onClick={() => toast.info('PDF download coming soon!')} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                  <Button 
                    onClick={() => cv.id && deleteCV(cv.id)} 
                    variant="destructive" 
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cvList.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No CVs Created Yet</h2>
            <p className="text-gray-500 mb-4">Create your first CV to get started</p>
            <Button onClick={createNewCV} className="bg-gradient-to-r from-[#122ec0] to-[#e16623]">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First CV
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
          {currentCV?.id ? 'Edit CV' : 'Create New CV'}
        </h1>
        <div className="space-x-2">
          <Button onClick={() => currentCV && setShowPreview(true)} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveCV} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save CV'}
          </Button>
          <Button onClick={() => setIsEditing(false)} variant="outline">
            Back to List
          </Button>
        </div>
      </div>

      {currentCV && (
        <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
          <CardHeader>
            <div className="space-y-2">
              <Label>CV Title</Label>
              <Input
                value={currentCV.title}
                onChange={(e) => setCurrentCV({ ...currentCV, title: e.target.value })}
                className="rounded-xl border-gray-200"
                placeholder="Enter CV title"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Personal Information - Auto-filled */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information (Auto-filled from Profile)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <p><strong>Name:</strong> {currentCV.personal_info.full_name}</p>
                <p><strong>Email:</strong> {currentCV.personal_info.email}</p>
                <p><strong>Phone:</strong> {currentCV.personal_info.phone}</p>
                <p><strong>ID Number:</strong> {currentCV.personal_info.id_number}</p>
                <p><strong>Date of Birth:</strong> {currentCV.personal_info.date_of_birth}</p>
                <p><strong>Address:</strong> {currentCV.personal_info.address}</p>
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education
                </h3>
                <Button onClick={addEducation} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </div>
              {currentCV.education.map((edu, index) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].institution = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Input
                        value={edu.qualification}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].qualification = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) => {
                          const newEducation = [...currentCV.education];
                          newEducation[index].year = e.target.value;
                          setCurrentCV({ ...currentCV, education: newEducation });
                        }}
                        className="rounded-xl border-gray-200"
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
                    className="mt-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Experience Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Experience
                </h3>
                <Button onClick={addExperience} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
              {currentCV.experience.map((exp, index) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].position = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].company = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={exp.duration}
                        onChange={(e) => {
                          const newExperience = [...currentCV.experience];
                          newExperience[index].duration = e.target.value;
                          setCurrentCV({ ...currentCV, experience: newExperience });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Responsibilities</Label>
                    <Textarea
                      value={exp.responsibilities.join('\n')}
                      onChange={(e) => {
                        const newExperience = [...currentCV.experience];
                        newExperience[index].responsibilities = e.target.value.split('\n').filter(r => r.trim());
                        setCurrentCV({ ...currentCV, experience: newExperience });
                      }}
                      className="rounded-xl border-gray-200"
                      rows={4}
                      placeholder="Enter each responsibility on a new line"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const newExperience = currentCV.experience.filter((_, i) => i !== index);
                      setCurrentCV({ ...currentCV, experience: newExperience });
                    }}
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Skills Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Skills
              </h3>
              <Textarea
                value={currentCV.skills.join('\n')}
                onChange={(e) => setCurrentCV({ 
                  ...currentCV, 
                  skills: e.target.value.split('\n').filter(s => s.trim()) 
                })}
                className="rounded-xl border-gray-200"
                rows={4}
                placeholder="Enter each skill on a new line"
              />
            </div>

            {/* References Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">References</h3>
                <Button onClick={addReference} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </div>
              {currentCV.references.map((ref, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={ref.name}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].name = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={ref.position}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].position = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={ref.company}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].company = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={ref.phone}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].phone = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={ref.email}
                        onChange={(e) => {
                          const newReferences = [...currentCV.references];
                          newReferences[index].email = e.target.value;
                          setCurrentCV({ ...currentCV, references: newReferences });
                        }}
                        className="rounded-xl border-gray-200"
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
                    className="mt-2"
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
