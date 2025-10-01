import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { CVData } from '../cv/CVBuilder';
import { pdfGenerator } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap } from 'lucide-react';

interface AdminCVPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData | null;
  learnerName: string;
}

export const AdminCVPreviewDialog: React.FC<AdminCVPreviewDialogProps> = ({
  open,
  onOpenChange,
  cv,
  learnerName
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cv) return;

    setIsGenerating(true);
    try {
      await pdfGenerator.generatePDF(cv, 'professional', 'high');
      toast.success('CV downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!cv) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{learnerName}'s CV - Professional Template</DialogTitle>
            <Button onClick={handleDownload} disabled={isGenerating} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Professional Template Preview */}
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {cv.personal_info.avatar_url ? (
                    <img src={cv.personal_info.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-white/80" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{cv.personal_info.full_name}</h1>
                  <div className="text-blue-100 space-y-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{cv.personal_info.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{cv.personal_info.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{cv.personal_info.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex">
              {/* Left Column - Main Content */}
              <div className="flex-1 p-8">
                {/* Experience Section */}
                {cv.experience.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-600 pb-2">
                      Professional Experience
                    </h2>
                    {cv.experience.map((exp, index) => (
                      <div key={index} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{exp.position}</h3>
                            <p className="text-blue-600 font-medium">{exp.company}</p>
                          </div>
                          <div className="text-right text-sm text-gray-600 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                          </div>
                        </div>
                        {exp.responsibilities.length > 0 && (
                          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                            {exp.responsibilities.map((resp, i) => (
                              <li key={i} className="text-sm">
                                <span className="font-medium">{resp.heading}:</span> {resp.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {/* Education Section */}
                {cv.education.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-600 pb-2">
                      Education
                    </h2>
                    {cv.education.map((edu, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <h3 className="text-lg font-semibold text-gray-800">{edu.qualification}</h3>
                        <p className="text-blue-600 font-medium">{edu.institution}</p>
                        <p className="text-gray-600 text-sm">{edu.year}</p>
                      </div>
                    ))}
                  </section>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="w-80 bg-gray-50 p-8">
                {/* Personal Details */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Details
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div><span className="font-medium">ID Number:</span> {cv.personal_info.id_number}</div>
                    <div><span className="font-medium">Date of Birth:</span> {cv.personal_info.date_of_birth}</div>
                    <div><span className="font-medium">Gender:</span> {cv.personal_info.gender}</div>
                    <div><span className="font-medium">Race:</span> {cv.personal_info.race}</div>
                    <div><span className="font-medium">Nationality:</span> {cv.personal_info.nationality}</div>
                    <div><span className="font-medium">Languages:</span> {cv.personal_info.languages.join(', ')}</div>
                  </div>
                </section>

                {/* Skills */}
                {cv.skills.length > 0 && (
                  <section className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-blue-600" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cv.skills.filter(skill => skill.trim()).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* References */}
                {cv.references.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">References</h3>
                    {cv.references.map((ref, index) => (
                      <div key={index} className="mb-4 last:mb-0 text-sm">
                        <h4 className="font-semibold text-gray-800">{ref.name}</h4>
                        <p className="text-gray-600">{ref.position}</p>
                        <p className="text-gray-600">{ref.company}</p>
                        <p className="text-blue-600">{ref.phone}</p>
                        <p className="text-blue-600">{ref.email}</p>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
