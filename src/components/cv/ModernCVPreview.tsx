import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, Palette, Download } from 'lucide-react';
import { CVData } from './CVBuilder';
import { PDFDownloadDialog } from './PDFDownloadDialog';
import { CVTemplate } from '@/lib/pdfGenerator';

interface ModernCVPreviewProps {
  cv: CVData;
}

type TemplateType = 'professional' | 'modern' | 'creative' | 'minimal';

export const ModernCVPreview: React.FC<ModernCVPreviewProps> = ({ cv }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const [showPDFDialog, setShowPDFDialog] = useState(false);

  const templates = [
    { id: 'professional', name: 'Professional', color: 'blue' },
    { id: 'modern', name: 'Modern', color: 'indigo' },
    { id: 'creative', name: 'Creative', color: 'purple' },
    { id: 'minimal', name: 'Minimal', color: 'gray' }
  ];

  const ProfessionalTemplate = () => (
    <div className="cv-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
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
  );

  const ModernTemplate = () => (
    <div className="cv-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="p-8 border-b-4 border-indigo-500">
        <div className="flex items-start space-x-8">
          <div className="flex-1">
            <h1 className="text-5xl font-light text-gray-900 mb-2">{cv.personal_info.full_name}</h1>
            <div className="text-gray-600 space-y-2">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  <span>{cv.personal_info.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-indigo-500" />
                  <span>{cv.personal_info.phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span>{cv.personal_info.address}</span>
              </div>
            </div>
          </div>
          <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden">
            {cv.personal_info.avatar_url ? (
              <img src={cv.personal_info.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-indigo-400" />
            )}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Experience */}
        {cv.experience.length > 0 && (
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-light text-gray-900">Experience</h2>
            </div>
            {cv.experience.map((exp, index) => (
              <div key={index} className="mb-6 pl-11 border-l-2 border-indigo-100 relative">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-500 rounded-full"></div>
                <div className="pb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">{exp.position}</h3>
                      <p className="text-indigo-600 font-medium">{exp.company}</p>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                    </span>
                  </div>
                  {exp.responsibilities.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {exp.responsibilities.map((resp, i) => (
                        <div key={i} className="text-gray-700">
                          <span className="font-medium text-gray-900">{resp.heading}:</span> {resp.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Education & Skills Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {cv.education.length > 0 && (
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-light text-gray-900">Education</h2>
              </div>
              {cv.education.map((edu, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-medium text-gray-900">{edu.qualification}</h3>
                  <p className="text-indigo-600">{edu.institution}</p>
                  <p className="text-gray-500 text-sm">{edu.year}</p>
                </div>
              ))}
            </section>
          )}

          {/* Skills */}
          {cv.skills.length > 0 && (
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-light text-gray-900">Skills</h2>
              </div>
              <div className="space-y-3">
                {cv.skills.filter(skill => skill.trim()).map((skill, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div className="cv-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header with Diagonal Design */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8 flex items-center space-x-6">
          <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden">
            {cv.personal_info.avatar_url ? (
              <img src={cv.personal_info.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-14 w-14 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">{cv.personal_info.full_name}</h1>
            <div className="grid grid-cols-2 gap-4 text-purple-100">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{cv.personal_info.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{cv.personal_info.phone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 translate-y-16"></div>
      </div>

      <div className="p-8 space-y-8">
        {/* Experience */}
        {cv.experience.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-6">
              Experience
            </h2>
            <div className="space-y-6">
              {cv.experience.map((exp, index) => (
                <div key={index} className="relative pl-8 border-l-4 border-purple-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-purple-600 font-medium">{exp.company}</p>
                      </div>
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm">
                        {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                      </span>
                    </div>
                    {exp.responsibilities.length > 0 && (
                      <div className="space-y-2">
                        {exp.responsibilities.map((resp, i) => (
                          <div key={i} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">
                              <span className="font-medium">{resp.heading}:</span> {resp.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Skills */}
        <div className="grid grid-cols-2 gap-8">
          {cv.education.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-4">
                Education
              </h2>
              {cv.education.map((edu, index) => (
                <div key={index} className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{edu.qualification}</h3>
                  <p className="text-purple-600">{edu.institution}</p>
                  <p className="text-gray-600 text-sm">{edu.year}</p>
                </div>
              ))}
            </section>
          )}

          {cv.skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-4">
                Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {cv.skills.filter(skill => skill.trim()).map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const MinimalTemplate = () => (
    <div className="cv-page bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="p-12">
        {/* Minimal Header */}
        <header className="text-center mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-5xl font-thin text-gray-900 mb-4 tracking-wide">
            {cv.personal_info.full_name}
          </h1>
          <div className="flex justify-center items-center space-x-8 text-gray-600">
            <span>{cv.personal_info.email}</span>
            <span>•</span>
            <span>{cv.personal_info.phone}</span>
            <span>•</span>
            <span>{cv.personal_info.address}</span>
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-12">
          {cv.experience.length > 0 && (
            <section>
              <h2 className="text-2xl font-thin text-gray-900 mb-8 tracking-wider uppercase border-b border-gray-100 pb-2">
                Experience
              </h2>
              {cv.experience.map((exp, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-xl font-medium text-gray-900">{exp.position}</h3>
                    <span className="text-gray-500 text-sm">
                      {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 font-medium">{exp.company}</p>
                  {exp.responsibilities.length > 0 && (
                    <div className="space-y-1">
                      {exp.responsibilities.map((resp, i) => (
                        <p key={i} className="text-gray-700 leading-relaxed">
                          • <span className="font-medium">{resp.heading}:</span> {resp.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {cv.education.length > 0 && (
            <section>
              <h2 className="text-2xl font-thin text-gray-900 mb-8 tracking-wider uppercase border-b border-gray-100 pb-2">
                Education
              </h2>
              {cv.education.map((edu, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{edu.qualification}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                    </div>
                    <span className="text-gray-500 text-sm">{edu.year}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {cv.skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-thin text-gray-900 mb-8 tracking-wider uppercase border-b border-gray-100 pb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {cv.skills.filter(skill => skill.trim()).map((skill, index) => (
                  <span key={index} className="text-gray-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'professional': return <ProfessionalTemplate />;
      case 'modern': return <ModernTemplate />;
      case 'creative': return <CreativeTemplate />;
      case 'minimal': return <MinimalTemplate />;
      default: return <ProfessionalTemplate />;
    }
  };

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Template Selection & Preview */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Template Selector */}
        <div className="xl:w-80 flex-shrink-0 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Choose Template:</span>
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  onClick={() => setSelectedTemplate(template.id as TemplateType)}
                  className="w-full justify-start"
                >
                  {template.name}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowPDFDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* CV Preview - Now takes remaining space and shows at readable size */}
        <div className="flex-1 min-w-0">
          <div className="w-full overflow-auto bg-gray-50 p-4 rounded-lg">
            <div className="mx-auto" style={{ width: '210mm', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .cv-page {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              page-break-after: always;
            }
            
            .cv-container {
              transform: none !important;
              margin: 0 !important;
            }
            
            @page {
              size: A4;
              margin: 0;
            }
          }
          
          .cv-page {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            overflow: hidden;
          }
          
          .cv-page h1, .cv-page h2, .cv-page h3 {
            font-weight: inherit;
            margin: 0;
          }
          
          .cv-page p {
            margin: 0;
          }
        `
      }} />

      {/* PDF Download Dialog */}
      <PDFDownloadDialog
        open={showPDFDialog}
        onOpenChange={setShowPDFDialog}
        cv={cv}
        currentTemplate={selectedTemplate as CVTemplate}
      />
    </div>
  );
};

export default ModernCVPreview;