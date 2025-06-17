
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Image, CheckCircle, X } from 'lucide-react';

const DocumentUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    size: number;
  }>>([]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user || !documentType) {
      toast.error('Please select a document type first');
      return;
    }

    setUploading(true);
    const files = Array.from(event.target.files);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            learner_id: user.id,
            document_type: documentType as any,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size
          });

        if (dbError) throw dbError;

        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: documentType,
          size: file.size
        }]);
      }

      // Award points for document upload
      await supabase
        .from('achievements')
        .insert({
          learner_id: user.id,
          badge_type: 'document_upload',
          badge_name: 'Document Uploaded',
          description: `Uploaded ${files.length} document(s)`,
          points_awarded: files.length * 10
        });

      toast.success(`Successfully uploaded ${files.length} document(s)!`);
      
      // Reset form
      setDocumentType('');
      if (event.target) event.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }, [user, documentType]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Upload className="h-6 w-6 text-[#122ec0]" />
            <CardTitle className="text-2xl bg-gradient-to-r from-[#122ec0] to-[#e16623] bg-clip-text text-transparent">
              Document Upload
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Upload your learnership documents and supporting materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-gray-700">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance_proof">Attendance Proof</SelectItem>
                <SelectItem value="logbook_page">Logbook Page</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold text-gray-700">Upload Files</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#122ec0] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading || !documentType}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className={`cursor-pointer ${!documentType ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FileText className="h-8 w-8 text-[#122ec0]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {uploading ? 'Uploading...' : 'Click to upload files'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, PDF, DOC up to 10MB each
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-gray-700">Uploaded Files</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-700">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.type.replace('_', ' ').toUpperCase()} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
