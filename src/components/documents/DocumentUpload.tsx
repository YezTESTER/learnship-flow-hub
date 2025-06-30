
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Download, Trash2, Eye, File, CheckCircle, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
}

const DocumentUpload = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const documentTypes = [
    { value: 'attendance_proof', label: 'Attendance Proof' },
    { value: 'logbook_page', label: 'Logbook Page' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('learner_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
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

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user) {
      toast.error('Please select a file and document type');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Create file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) throw uploadError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          learner_id: user.id,
          document_type: documentType,
          file_name: selectedFile.name,
          file_path: uploadData.path,
          file_size: selectedFile.size
        }]);

      if (dbError) throw dbError;

      // Award points for document upload
      await supabase
        .from('achievements')
        .insert([{
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: 'Document Uploaded',
          description: `Successfully uploaded ${documentTypes.find(t => t.value === documentType)?.label}`,
          points_awarded: 5,
          badge_color: '#8B5CF6',
          badge_icon: 'file'
        }]);

      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('');
      setUploadProgress(0);
      fetchDocuments();
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

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
        return <File className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Eye className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Section */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Upload className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Document Upload
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Upload your learnership documents for compliance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Selection */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File *</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="rounded-xl border-gray-200"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, Word documents, Images (max 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      {getDocumentIcon(selectedFile.name)}
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">{selectedFile.name}</p>
                        <p className="text-sm text-blue-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#122ec0] to-[#e16623] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || loading}
              className="w-full bg-gradient-to-r from-[#122ec0] to-[#e16623] hover:from-[#0f2499] hover:to-[#d55a1f] text-white rounded-xl py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                'Uploading...'
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>My Documents ({documents.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No documents uploaded</h3>
              <p className="text-gray-500">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getDocumentIcon(doc.file_name)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{doc.file_name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="capitalize">
                          {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span>Document Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <ul className="space-y-2 text-sm">
            <li>• <strong>Attendance Proof:</strong> Monthly attendance records or time sheets</li>
            <li>• <strong>Logbook Page:</strong> Completed logbook pages showing daily activities</li>
            <li>• <strong>Assessment:</strong> Completed assessments or evaluation forms</li>
            <li>• <strong>Other:</strong> Any additional supporting documents</li>
            <li>• <strong>File Requirements:</strong> Max 10MB, PDF/Word/Images only</li>
            <li>• <strong>Naming:</strong> Use clear, descriptive file names</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
