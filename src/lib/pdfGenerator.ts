import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type CVTemplate = 'basic' | 'professional' | 'modern' | 'creative' | 'minimal';
export type PDFQuality = 'standard' | 'high';

export interface CVData {
  id?: string;
  title: string;
  is_published?: boolean;
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
    avatar_url?: string;
    area_of_residence?: string;
    has_disability?: boolean;
    disability_description?: string;
    has_drivers_license?: boolean;
    license_codes?: string[];
    has_own_transport?: boolean;
    public_transport_types?: string[];
  };
  education: Array<{
    id?: string;
    institution: string;
    qualification: string;
    year: string;
  }>;
  experience: Array<{
    id?: string;
    position: string;
    company: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    responsibilities: Array<{
      id?: string;
      heading: string;
      description: string;
    }>;
  }>;
  skills: string[];
  references: Array<{
    name: string;
    position: string;
    company: string;
    phone: string;
    email: string;
  }>;
}

class PDFGenerator {
  private async createTemplateHTML(cv: CVData, template: CVTemplate): Promise<string> {
    const { personal_info, education, experience, skills, references } = cv;
    
    const baseStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; line-height: 1.5; color: #1f2937; }
        .container { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .text-sm { font-size: 14px; }
        .text-xs { font-size: 12px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .space-x-4 > * + * { margin-left: 16px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        .skill-tag { display: inline-block; background: #f3f4f6; padding: 4px 12px; margin: 2px; border-radius: 16px; font-size: 12px; }
      </style>
    `;

    switch (template) {
      case 'professional':
        return `
          ${baseStyles}
          <style>
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; }
            .section-title { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 4px; }
            .skill-tag { background: #dbeafe; color: #1e40af; }
          </style>
          <div class="container">
            <div class="header">
              <div class="flex items-center space-x-4">
                ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" class="avatar" />` : ''}
                <div>
                  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${personal_info.full_name}</h1>
                  <p>${personal_info.email} | ${personal_info.phone}</p>
                  <p>${personal_info.address}</p>
                </div>
              </div>
            </div>
            <div style="padding: 24px;">
              ${this.generateSections(cv)}
            </div>
          </div>
        `;

      case 'modern':
        return `
          ${baseStyles}
          <style>
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px; }
            .section-title { color: #6366f1; border-left: 4px solid #6366f1; padding-left: 12px; }
            .skill-tag { background: #e0e7ff; color: #6366f1; }
            .timeline-item { border-left: 2px solid #6366f1; padding-left: 12px; margin-left: 8px; }
          </style>
          <div class="container">
            <div class="header">
              <div class="flex items-center space-x-4">
                ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" class="avatar" />` : ''}
                <div>
                  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${personal_info.full_name}</h1>
                  <p>${personal_info.email} | ${personal_info.phone}</p>
                  <p>${personal_info.address}</p>
                </div>
              </div>
            </div>
            <div style="padding: 24px;">
              ${this.generateSections(cv, true)}
            </div>
          </div>
        `;

      case 'creative':
        return `
          ${baseStyles}
          <style>
            .header { 
              background: linear-gradient(135deg, #8b5cf6, #ec4899); 
              color: white; 
              padding: 24px; 
              clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);
            }
            .section-title { 
              color: #8b5cf6; 
              font-size: 20px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .skill-tag { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; }
          </style>
          <div class="container">
            <div class="header">
              <div class="flex items-center space-x-4">
                ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" class="avatar" />` : ''}
                <div>
                  <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${personal_info.full_name}</h1>
                  <p style="font-size: 16px;">${personal_info.email} | ${personal_info.phone}</p>
                  <p style="font-size: 16px;">${personal_info.address}</p>
                </div>
              </div>
            </div>
            <div style="padding: 24px;">
              ${this.generateSections(cv)}
            </div>
          </div>
        `;

      case 'minimal':
        return `
          ${baseStyles}
          <style>
            .header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
            .section-title { color: #111827; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .skill-tag { background: #f9fafb; color: #374151; border: 1px solid #e5e7eb; }
          </style>
          <div class="container">
            <div class="header">
              <div style="text-align: center;">
                <h1 style="font-size: 32px; font-weight: 300; margin-bottom: 16px; letter-spacing: 2px;">${personal_info.full_name}</h1>
                <p style="color: #6b7280;">${personal_info.email} | ${personal_info.phone}</p>
                <p style="color: #6b7280;">${personal_info.address}</p>
              </div>
            </div>
            <div style="padding: 24px;">
              ${this.generateSections(cv)}
            </div>
          </div>
        `;

      default: // basic
        return `
          ${baseStyles}
          <div class="container" style="padding: 24px;">
            <div class="section">
              <div class="flex items-center space-x-4 mb-4">
                ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" class="avatar" />` : ''}
                <div>
                  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${personal_info.full_name}</h1>
                  <p>${personal_info.email} | ${personal_info.phone}</p>
                  <p>${personal_info.address}</p>
                  <p>ID: ${personal_info.id_number} | DOB: ${personal_info.date_of_birth}</p>
                  <p>Gender: ${personal_info.gender} | Race: ${personal_info.race}</p>
                  <p>Nationality: ${personal_info.nationality} | Languages: ${personal_info.languages.join(', ')}</p>
                </div>
              </div>
            </div>
            ${this.generateSections(cv)}
          </div>
        `;
    }
  }

  private generateSections(cv: CVData, timeline = false): string {
    let html = '';

    // Education Section
    if (cv.education.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">Education</h2>
          ${cv.education.map(edu => `
            <div class="${timeline ? 'timeline-item' : ''} mb-4">
              <h3 style="font-weight: 600;">${edu.qualification}</h3>
              <p style="color: #6b7280;">${edu.institution} - ${edu.year}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Experience Section
    if (cv.experience.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">Experience</h2>
          ${cv.experience.map(exp => `
            <div class="${timeline ? 'timeline-item' : ''} mb-4">
              <h3 style="font-weight: 600;">${exp.position}</h3>
              <p style="color: #6b7280; margin-bottom: 8px;">${exp.company} - ${exp.start_date} to ${exp.is_current ? 'Present' : exp.end_date}</p>
              ${exp.responsibilities.length > 0 ? `
                <div>
                  <h4 style="font-weight: 500; margin-bottom: 4px;">Key Responsibilities:</h4>
                  <ul style="list-style: disc; padding-left: 20px;">
                    ${exp.responsibilities.map(resp => `
                      <li style="margin-bottom: 4px;">
                        <strong>${resp.heading}:</strong> ${resp.description}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    // Skills Section
    if (cv.skills.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">Skills</h2>
          <div>
            ${cv.skills.filter(skill => skill.trim()).map(skill => `
              <span class="skill-tag">${skill}</span>
            `).join('')}
          </div>
        </div>
      `;
    }

    // References Section
    if (cv.references.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">References</h2>
          <div class="grid-2">
            ${cv.references.map(ref => `
              <div>
                <h3 style="font-weight: 600;">${ref.name}</h3>
                <p style="color: #6b7280;">${ref.position} at ${ref.company}</p>
                <p style="color: #6b7280;">${ref.phone} | ${ref.email}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return html;
  }

  public async generatePDF(
    cv: CVData, 
    template: CVTemplate = 'basic', 
    quality: PDFQuality = 'standard'
  ): Promise<void> {
    try {
      // Create HTML for the template
      const htmlContent = await this.createTemplateHTML(cv, template);
      
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);

      // Generate canvas from HTML
      const canvas = await html2canvas(container, {
        scale: quality === 'high' ? 2 : 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      const pageHeight = 297; // A4 height in mm

      // Add pages as needed
      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(
          imgData,
          'PNG',
          0,
          -position,
          imgWidth,
          imgHeight
        );
        
        position += pageHeight;
      }

      // Generate filename
      const templateName = template.charAt(0).toUpperCase() + template.slice(1);
      const filename = `${cv.personal_info.full_name.replace(/\s+/g, '_')}_CV_${templateName}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }
}

export const pdfGenerator = new PDFGenerator();