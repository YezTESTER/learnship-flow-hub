import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Download, Trash2, Eye, File, CheckCircle, AlertCircle, FolderOpen, HelpCircle } from 'lucide-react';
interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
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
      title: 'Office Documents',
      icon: '📋',
      documents: [{
        value: 'work_attendance_log',
        label: 'Work Attendance Log Book/Time Sheet',
        points: 0,
        required: false,
        whenRequired: true
      }, {
        value: 'class_attendance_proof',
        label: 'Class Attendance Proof/Time Sheet',
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
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);
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
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
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
      // Get the appropriate bucket for this document type
      const bucketName = getBucketForDocumentType(documentType);

      // Create file path with user folder: bucket > user_id > filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to the categorized storage bucket
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from(bucketName).upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      // Save document record to database
      const {
        error: dbError
      } = await supabase.from('documents').insert({
        learner_id: user.id,
        document_type: documentType as any,
        file_name: selectedFile.name,
        file_path: uploadData.path,
        file_size: selectedFile.size
      });
      if (dbError) throw dbError;

      // Award points based on document type
      const docInfo = getDocumentInfo(documentType);
      if (docInfo && docInfo.points > 0) {
        await supabase.from('achievements').insert({
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: 'Document Uploaded',
          description: `Successfully uploaded ${docInfo.label}`,
          points_awarded: docInfo.points,
          badge_color: '#8B5CF6',
          badge_icon: 'file'
        });
      }
      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('');
      setUploadProgress(0);
      fetchDocuments();

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
  return <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0 px-0">
      {/* Upload Section */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-[#122ec0]" />
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Document Upload
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 text-sm sm:text-base">
            Upload your learnership documents for compliance tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 px-[8px]">
          <div className="space-y-4 sm:space-y-6">
            {/* File Selection */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="document-type" className="text-sm sm:text-base">Document Type *</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-500 cursor-pointer" />
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Document Point System</DialogTitle>
                          <DialogDescription>
                            Here's a breakdown of the points awarded for each document.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {Object.entries(documentCategories).map(([key, category]) => (
                            <div key={key}>
                              <h4 className="font-semibold text-gray-800">{category.icon} {category.title}</h4>
                              <ul className="list-disc list-inside space-y-1 mt-1">
                                {category.documents.map(doc => (
                                  <li key={doc.value} className="text-sm text-gray-600">
                                    {doc.label}:
                                    <span className="font-semibold ml-1">
                                      {doc.points > 0 ? `${doc.points} points` : 'No points'}
                                    </span>
                                    {doc.required && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2">Required</span>}
                                    {doc.whenRequired && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-2">When Required</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] overflow-y-auto">
                      {Object.entries(documentCategories).map(([key, category]) => <div key={key}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {category.icon} {category.title}
                          </div>
                          {category.documents.map(doc => <SelectItem key={doc.value} value={doc.value} className="pl-6">
                              <div className="flex items-center justify-between w-full">
                                <span>{doc.label}</span>
                              </div>
                            </SelectItem>)}
                        </div>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-sm sm:text-base">Select File *</Label>
                  <Input id="file-upload" type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="rounded-xl border-gray-200" />
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, Word documents, Images (max 10MB)
                  </p>
                </div>

                {selectedFile && <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      {getDocumentIcon(selectedFile.name)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-blue-800 truncate">{selectedFile.name}</p>
                        <p className="text-sm text-blue-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>}

                {uploadProgress > 0 && uploadProgress < 100 && <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#122ec0] to-[#e16623] h-2 rounded-full transition-all duration-300" style={{
                    width: `${uploadProgress}%`
                  }}></div>
                    </div>
                  </div>}
              </div>
            </div>

            <Button onClick={handleUpload} disabled={!selectedFile || !documentType || loading} className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105">
              {loading ? 'Uploading...' : <>
                  <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Upload Document
                </>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List by Category */}
      {Object.entries(documentCategories).map(([categoryKey, category]) => {
      const categoryDocs = getDocumentsByCategory(categoryKey);
      return <Card key={categoryKey}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <span className="text-xl sm:text-2xl">{category.icon}</span>
                <span>{category.title}</span>
                <span className="text-sm sm:text-base text-gray-500">({categoryDocs.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {categoryDocs.length === 0 ? <div className="text-center py-8 sm:py-12">
                  <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">No {category.title.toLowerCase()}</h3>
                  <p className="text-gray-500 text-sm sm:text-base">Upload your first document in this category</p>
                </div> : <div className="space-y-3 sm:space-y-4">
                  {categoryDocs.map(doc => <div key={doc.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                    </div>)}
                </div>}
            </CardContent>
          </Card>;
    })}

      {/* Document Guidelines */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-yellow-800 text-lg sm:text-xl">
            <AlertCircle className="h-5 w-5" />
            <span>Document Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 p-4 sm:p-6">
          <div className="space-y-4 text-sm sm:text-base">
            <div>
              <h4 className="font-semibold mb-2">Personal Documents:</h4>
              <ul className="space-y-1 text-xs sm:text-sm ml-4">
                <li>• Submit certified copies of all personal documents</li>
                <li>• Qualifications must be certified by SAQA or relevant authority</li>
                <li>• Bank account proof should be recent (within 3 months)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Office Documents:</h4>
              <ul className="space-y-1 text-xs sm:text-sm ml-4">
                <li>• Submit monthly attendance records as required</li>
                <li>• Time sheets must be signed by supervisor</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contracts:</h4>
              <ul className="space-y-1 text-xs sm:text-sm ml-4">
                <li>• All contract documents must be fully completed</li>
                <li>• POPIA form is mandatory for all learners</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">File Requirements:</h4>
              <ul className="space-y-1 text-xs sm:text-sm ml-4">
                <li>• Maximum file size: 10MB</li>
                <li>• Accepted formats: PDF, Word documents, Images</li>
                <li>• Use clear, descriptive file names</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default DocumentUpload;