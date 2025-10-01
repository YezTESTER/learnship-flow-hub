import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, FileText, Palette, Briefcase, Zap, Minimize2 } from 'lucide-react';
import { pdfGenerator, CVData, CVTemplate, PDFQuality } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface PDFDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData;
  currentTemplate?: CVTemplate;
}

export const PDFDownloadDialog: React.FC<PDFDownloadDialogProps> = ({
  open,
  onOpenChange,
  cv,
  currentTemplate = 'basic'
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>(currentTemplate);
  const [quality, setQuality] = useState<PDFQuality>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const templates = [
    {
      id: 'professional' as CVTemplate,
      name: 'Professional',
      description: 'Blue gradient header, structured layout',
      icon: Briefcase,
      preview: 'Blue header with sidebar-style layout'
    },
    {
      id: 'modern' as CVTemplate,
      name: 'Modern',
      description: 'Timeline design with indigo accents',
      icon: Zap,
      preview: 'Modern timeline with purple accents'
    },
    {
      id: 'creative' as CVTemplate,
      name: 'Creative',
      description: 'Purple gradient with dynamic elements',
      icon: Palette,
      preview: 'Creative design with purple/pink gradients'
    },
    {
      id: 'minimal' as CVTemplate,
      name: 'Minimal',
      description: 'Clean typography-focused design',
      icon: Minimize2,
      preview: 'Minimalist black and white design'
    }
  ];

  const handleDownload = async () => {
    if (!cv || !cv.personal_info?.full_name) {
      toast({
        title: "Error",
        description: "CV data is incomplete. Please ensure all required fields are filled.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await pdfGenerator.generatePDF(cv, selectedTemplate, quality);
      toast({
        title: "Success!",
        description: `CV downloaded successfully as ${selectedTemplate} template.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download CV as PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose Template</Label>
            <RadioGroup
              value={selectedTemplate}
              onValueChange={(value) => setSelectedTemplate(value as CVTemplate)}
              className="space-y-3"
            >
              {templates.map((template) => (
                <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={template.id} className="flex items-center gap-2 cursor-pointer">
                      <template.icon className="h-4 w-4" />
                      <span className="font-medium">{template.name}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.preview}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Quality Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Quality</Label>
            <RadioGroup
              value={quality}
              onValueChange={(value) => setQuality(value as PDFQuality)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="cursor-pointer">
                  Standard (Faster download)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">
                  High Quality (Better for printing)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Preview</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Filename: {cv.personal_info?.full_name?.replace(/\s+/g, '_')}_CV_{selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}.pdf
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating} className="min-w-[120px]">
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};