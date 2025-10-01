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
        body { font-family: 'Inter', sans-serif; line-height: 1.5; color: #1f2937; background: white; }
        .container { width: 210mm; min-height: 297mm; margin: 0; padding: 0; background: white; }
        svg { vertical-align: middle; display: inline-block; }
        img { vertical-align: middle; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .justify-between { justify-content: space-between; }
        .space-x-2 > * + * { margin-left: 8px; }
        .space-x-4 > * + * { margin-left: 16px; }
        .space-x-6 > * + * { margin-left: 24px; }
        .space-x-8 > * + * { margin-left: 32px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .space-y-3 > * + * { margin-top: 12px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .p-8 { padding: 32px; }
        .px-3 { padding-left: 12px; padding-right: 12px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 14px; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .text-4xl { font-size: 36px; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .w-24 { width: 96px; }
        .h-24 { width: 96px; }
        .w-full { width: 100%; }
        .h-full { height: 100%; }
        .rounded-full { border-radius: 50%; }
        .list-disc { list-style-type: disc; }
        .list-inside { list-style-position: inside; }
        .ml-4 { margin-left: 16px; }
        .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
        .pb-2 { padding-bottom: 8px; }
        .last-mb-0:last-child { margin-bottom: 0; }
      </style>
    `;

    switch (template) {
      case 'professional':
        return `
          ${baseStyles}
          <style>
            .prof-header { 
              background: linear-gradient(to right, #2563eb, #1d4ed8); 
              color: white; 
              padding: 32px; 
            }
            .prof-avatar { 
              width: 96px; 
              height: 96px; 
              border-radius: 50%; 
              background: rgba(255, 255, 255, 0.2); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              overflow: hidden; 
              flex-shrink: 0; 
            }
            .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .prof-text-blue { color: #bfdbfe; }
            .prof-main { display: flex; background: white; }
            .prof-content { 
              flex: 1; 
              padding: 32px; 
              background: white; 
            }
            .prof-sidebar { 
              width: 320px; 
              background: #f9fafb; 
              padding: 32px; 
            }
            .prof-section-title { 
              font-size: 24px; 
              font-weight: 700; 
              color: #1f2937; 
              margin-bottom: 24px; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 8px; 
            }
            .prof-sidebar-title { 
              font-size: 18px; 
              font-weight: 700; 
              color: #1f2937; 
              margin-bottom: 16px; 
              display: flex; 
              align-items: center; 
            }
            .prof-sidebar-icon { 
              width: 20px; 
              height: 20px; 
              margin-right: 8px; 
              color: #2563eb; 
              vertical-align: middle;
              display: inline-block;
            }
            .prof-company { color: #2563eb; font-weight: 500; }
            .prof-date { 
              font-size: 14px; 
              color: #6b7280; 
              display: flex; 
              align-items: center; 
            }
            .prof-skill { 
              display: inline-block; 
              background: #dbeafe; 
              color: #1e40af; 
              padding: 4px 12px; 
              margin: 2px; 
              border-radius: 16px; 
              font-size: 12px; 
              font-weight: 500; 
            }
          </style>
          <div class="container">
            <div class="prof-header">
              <div class="flex items-center space-x-6">
                <div class="prof-avatar">
                  ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" alt="Profile" />` : '<svg width="48" height="48" fill="rgba(255,255,255,0.8)" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}
                </div>
                <div style="flex: 1;">
                  <h1 style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">${personal_info.full_name}</h1>
                  <div class="prof-text-blue space-y-1">
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center space-x-2">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        <span style="font-size: 14px;">${personal_info.email}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        <span style="font-size: 14px;">${personal_info.phone}</span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      <span style="font-size: 14px;">${personal_info.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="prof-main">
              <div class="prof-content">
                ${this.generateProfessionalSections(cv)}
              </div>

              <div class="prof-sidebar">
                <section class="mb-8">
                  <h3 class="prof-sidebar-title">
                    <svg class="prof-sidebar-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Personal Details
                  </h3>
                  <div class="space-y-3" style="font-size: 14px; color: #374151;">
                    <div><span style="font-weight: 500;">ID Number:</span> ${personal_info.id_number}</div>
                    <div><span style="font-weight: 500;">Date of Birth:</span> ${personal_info.date_of_birth}</div>
                    <div><span style="font-weight: 500;">Gender:</span> ${personal_info.gender}</div>
                    <div><span style="font-weight: 500;">Race:</span> ${personal_info.race}</div>
                    <div><span style="font-weight: 500;">Nationality:</span> ${personal_info.nationality}</div>
                    <div><span style="font-weight: 500;">Languages:</span> ${personal_info.languages.join(', ')}</div>
                  </div>
                </section>

                ${skills.length > 0 ? `
                <section class="mb-8">
                  <h3 class="prof-sidebar-title">
                    <svg class="prof-sidebar-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-8H19V2h-2v1H7V2H5v1H4.5C3.12 3 2 4.12 2 5.5v14C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-14C22 4.12 20.88 3 19.5 3z"/></svg>
                    Skills
                  </h3>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${skills.filter(skill => skill.trim()).map(skill => `
                      <span class="prof-skill">${skill}</span>
                    `).join('')}
                  </div>
                </section>
                ` : ''}

                ${references.length > 0 ? `
                <section>
                  <h3 class="prof-sidebar-title">References</h3>
                  ${references.map(ref => `
                    <div class="mb-4 last-mb-0" style="font-size: 14px;">
                      <h4 style="font-weight: 600; color: #1f2937;">${ref.name}</h4>
                      <p style="color: #6b7280;">${ref.position}</p>
                      <p style="color: #6b7280;">${ref.company}</p>
                      <p style="color: #2563eb;">${ref.phone}</p>
                      <p style="color: #2563eb;">${ref.email}</p>
                    </div>
                  `).join('')}
                </section>
                ` : ''}
              </div>
            </div>
          </div>
        `;

      case 'modern':
        return `
          ${baseStyles}
          <style>
            .modern-header { padding: 32px; border-bottom: 4px solid #6366f1; }
            .modern-name { font-size: 40px; font-weight: 300; color: #111827; margin-bottom: 8px; }
            .modern-avatar { width: 128px; height: 128px; border-radius: 8px; background: linear-gradient(to bottom right, #e0e7ff, #c7d2fe); display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .modern-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .modern-contact { color: #6b7280; }
            .modern-icon { width: 16px; height: 16px; color: #6366f1; vertical-align: middle; display: inline-block; }
            .modern-section-header { display: flex; align-items: center; margin-bottom: 24px; }
            .modern-section-icon { width: 32px; height: 32px; background: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
            .modern-section-title { font-size: 24px; font-weight: 300; color: #111827; }
            .modern-timeline { margin-bottom: 24px; padding-left: 44px; border-left: 2px solid #e0e7ff; position: relative; }
            .modern-timeline-dot { position: absolute; left: -8px; top: 0; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; }
            .modern-company { color: #6366f1; font-weight: 500; }
            .modern-date { font-size: 14px; color: #6b7280; background: #f3f4f6; padding: 4px 12px; border-radius: 16px; }
            .modern-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
            .modern-skill { display: flex; align-items: center; margin-bottom: 12px; }
            .modern-skill-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; margin-right: 12px; }
          </style>
          <div class="container">
            <div class="modern-header">
              <div class="flex items-start space-x-8">
                <div style="flex: 1;">
                  <h1 class="modern-name">${personal_info.full_name}</h1>
                  <div class="modern-contact space-y-2">
                    <div class="flex items-center space-x-6">
                      <div class="flex items-center space-x-2">
                        <svg class="modern-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        <span>${personal_info.email}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <svg class="modern-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        <span>${personal_info.phone}</span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <svg class="modern-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      <span>${personal_info.address}</span>
                    </div>
                  </div>
                </div>
                <div class="modern-avatar">
                  ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" alt="Profile" />` : '<svg width="64" height="64" fill="#6366f1" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}
                </div>
              </div>
            </div>

            <div class="p-8 space-y-8">
              ${cv.experience.length > 0 ? `
              <section>
                <div class="modern-section-header">
                  <div class="modern-section-icon">
                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
                  </div>
                  <h2 class="modern-section-title">Experience</h2>
                </div>
                ${cv.experience.map(exp => `
                  <div class="modern-timeline">
                    <div class="modern-timeline-dot"></div>
                    <div style="padding-bottom: 24px;">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <h3 style="font-size: 20px; font-weight: 500; color: #111827;">${exp.position}</h3>
                          <p class="modern-company">${exp.company}</p>
                        </div>
                        <span class="modern-date">
                          ${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}
                        </span>
                      </div>
                      ${exp.responsibilities.length > 0 ? `
                        <div style="margin-top: 12px; line-height: 1.6;">
                          ${exp.responsibilities.map(resp => `
                            <div style="color: #374151; margin-bottom: 8px;">
                              <span style="font-weight: 500; color: #111827;">${resp.heading}:</span> ${resp.description}
                            </div>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </section>
              ` : ''}

              <div class="modern-grid">
                ${cv.education.length > 0 ? `
                <section>
                  <div class="modern-section-header">
                    <div class="modern-section-icon">
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
                    </div>
                    <h2 class="modern-section-title">Education</h2>
                  </div>
                  ${cv.education.map(edu => `
                    <div class="mb-4">
                      <h3 style="font-weight: 500; color: #111827;">${edu.qualification}</h3>
                      <p class="modern-company">${edu.institution}</p>
                      <p style="color: #6b7280; font-size: 14px;">${edu.year}</p>
                    </div>
                  `).join('')}
                </section>
                ` : ''}

                ${cv.skills.length > 0 ? `
                <section>
                  <div class="modern-section-header">
                    <div class="modern-section-icon">
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-8H19V2h-2v1H7V2H5v1H4.5C3.12 3 2 4.12 2 5.5v14C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-14C22 4.12 20.88 3 19.5 3z"/></svg>
                    </div>
                    <h2 class="modern-section-title">Skills</h2>
                  </div>
                  <div>
                    ${cv.skills.filter(skill => skill.trim()).map(skill => `
                      <div class="modern-skill">
                        <div class="modern-skill-dot"></div>
                        <span style="color: #374151;">${skill}</span>
                      </div>
                    `).join('')}
                  </div>
                </section>
                ` : ''}
              </div>
            </div>
          </div>
        `;

      case 'creative':
        return `
          ${baseStyles}
          <style>
            .creative-header { 
              position: relative;
              background: linear-gradient(to bottom right, #8b5cf6, #7c3aed, #ec4899);
              color: white; 
              overflow: hidden;
              padding: 32px;
            }
            .creative-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.2); }
            .creative-bg-circle { position: absolute; bottom: 0; right: 0; width: 128px; height: 128px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; transform: translate(64px, 64px); }
            .creative-header-content { position: relative; display: flex; align-items: center; gap: 24px; }
            .creative-avatar { 
              width: 112px; 
              height: 112px; 
              border-radius: 50%; 
              background: rgba(255, 255, 255, 0.2); 
              backdrop-filter: blur(4px);
              border: 4px solid rgba(255, 255, 255, 0.3); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              overflow: hidden;
            }
            .creative-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .creative-name { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
            .creative-contact { color: #e9d5ff; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .creative-section-title { 
              font-size: 28px; 
              font-weight: 700;
              background: linear-gradient(to right, #8b5cf6, #ec4899);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 24px;
            }
            .creative-timeline { 
              position: relative; 
              padding-left: 32px; 
              border-left: 4px solid #e9d5ff; 
              margin-bottom: 24px;
            }
            .creative-timeline-dot { 
              position: absolute; 
              left: -8px; 
              top: 0; 
              width: 16px; 
              height: 16px; 
              background: linear-gradient(to right, #8b5cf6, #ec4899); 
              border-radius: 50%; 
            }
            .creative-exp-card { 
              background: linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
              padding: 24px; 
              border-radius: 8px; 
              margin-bottom: 24px;
            }
            .creative-company { color: #8b5cf6; font-weight: 500; }
            .creative-date { 
              background: linear-gradient(to right, #8b5cf6, #ec4899); 
              color: white; 
              padding: 4px 12px; 
              border-radius: 16px; 
              font-size: 14px;
              display: inline-block;
            }
            .creative-skill { 
              background: linear-gradient(to right, #8b5cf6, #ec4899); 
              color: white; 
              padding: 8px 16px; 
              margin: 4px; 
              border-radius: 16px; 
              font-size: 14px; 
              font-weight: 500;
              display: inline-block;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .creative-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
            .creative-responsibility { 
              display: flex; 
              align-items: flex-start; 
              margin-bottom: 8px;
            }
            .creative-resp-dot { 
              width: 8px; 
              height: 8px; 
              background: #a855f7; 
              border-radius: 50%; 
              margin-right: 8px; 
              margin-top: 6px;
              flex-shrink: 0;
            }
            .creative-edu-card {
              background: linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 16px;
            }
          </style>
          <div class="container">
            <div class="creative-header">
              <div class="creative-overlay"></div>
              <div class="creative-bg-circle"></div>
              <div class="creative-header-content">
                <div class="creative-avatar">
                  ${personal_info.avatar_url ? `<img src="${personal_info.avatar_url}" alt="Profile" />` : '<svg width="56" height="56" fill="white" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}
                </div>
                <div style="flex: 1;">
                  <h1 class="creative-name">${personal_info.full_name}</h1>
                  <div class="creative-contact">
                    <div class="flex items-center space-x-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      <span style="font-size: 14px;">${personal_info.email}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                      <span style="font-size: 14px;">${personal_info.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-8 space-y-8">
              ${cv.experience.length > 0 ? `
              <section>
                <h2 class="creative-section-title">Experience</h2>
                <div>
                  ${cv.experience.map(exp => `
                    <div class="creative-timeline">
                      <div class="creative-timeline-dot"></div>
                      <div class="creative-exp-card">
                        <div class="flex justify-between items-start mb-3">
                          <div>
                            <h3 style="font-size: 20px; font-weight: 600; color: #111827;">${exp.position}</h3>
                            <p class="creative-company">${exp.company}</p>
                          </div>
                          <span class="creative-date">
                            ${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}
                          </span>
                        </div>
                        ${exp.responsibilities.length > 0 ? `
                          <div>
                            ${exp.responsibilities.map(resp => `
                              <div class="creative-responsibility">
                                <div class="creative-resp-dot"></div>
                                <span style="color: #374151;">
                                  <span style="font-weight: 500;">${resp.heading}:</span> ${resp.description}
                                </span>
                              </div>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </section>
              ` : ''}

              <div class="creative-grid">
                ${cv.education.length > 0 ? `
                <section>
                  <h2 class="creative-section-title">Education</h2>
                  ${cv.education.map(edu => `
                    <div class="creative-edu-card">
                      <h3 style="font-weight: 600; color: #111827;">${edu.qualification}</h3>
                      <p class="creative-company">${edu.institution}</p>
                      <p style="color: #6b7280; font-size: 14px;">${edu.year}</p>
                    </div>
                  `).join('')}
                </section>
                ` : ''}

                ${cv.skills.length > 0 ? `
                <section>
                  <h2 class="creative-section-title">Skills</h2>
                  <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                    ${cv.skills.filter(skill => skill.trim()).map(skill => `
                      <span class="creative-skill">${skill}</span>
                    `).join('')}
                  </div>
                </section>
                ` : ''}
              </div>
            </div>
          </div>
        `;

      case 'minimal':
        return `
          ${baseStyles}
          <style>
            .minimal-header { padding: 32px; border-bottom: 1px solid #e5e7eb; text-align: center; }
            .minimal-name { font-size: 32px; font-weight: 300; margin-bottom: 16px; letter-spacing: 2px; color: #111827; }
            .minimal-contact { color: #6b7280; line-height: 1.6; }
            .minimal-section-title { 
              color: #111827; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              font-size: 18px;
              margin-bottom: 24px;
            }
            .minimal-item { margin-bottom: 24px; }
            .minimal-position { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 4px; }
            .minimal-company { color: #6b7280; margin-bottom: 8px; }
            .minimal-date { font-size: 14px; color: #9ca3af; }
            .minimal-responsibility { margin-bottom: 8px; color: #4b5563; }
            .minimal-skill { 
              background: #f9fafb; 
              color: #374151; 
              border: 1px solid #e5e7eb; 
              padding: 6px 16px; 
              margin: 4px; 
              border-radius: 16px; 
              font-size: 14px;
              display: inline-block;
            }
            .minimal-ref { 
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 16px;
            }
            .minimal-ref-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
            .minimal-ref-details { color: #6b7280; font-size: 14px; line-height: 1.5; }
            .minimal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
          </style>
          <div class="container">
            <div class="minimal-header">
              <h1 class="minimal-name">${personal_info.full_name}</h1>
              <div class="minimal-contact">
                <p>${personal_info.email} | ${personal_info.phone}</p>
                <p>${personal_info.address}</p>
              </div>
            </div>
            
            <div class="p-8 space-y-8">
              ${cv.experience.length > 0 ? `
              <section>
                <h2 class="minimal-section-title">Experience</h2>
                ${cv.experience.map(exp => `
                  <div class="minimal-item">
                    <h3 class="minimal-position">${exp.position}</h3>
                    <p class="minimal-company">${exp.company}</p>
                    <p class="minimal-date">${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}</p>
                    ${exp.responsibilities.length > 0 ? `
                      <div style="margin-top: 12px;">
                        ${exp.responsibilities.map(resp => `
                          <div class="minimal-responsibility">
                            <span style="font-weight: 500;">${resp.heading}:</span> ${resp.description}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </section>
              ` : ''}

              <div class="minimal-grid">
                ${cv.education.length > 0 ? `
                <section>
                  <h2 class="minimal-section-title">Education</h2>
                  ${cv.education.map(edu => `
                    <div class="minimal-item">
                      <h3 class="minimal-position">${edu.qualification}</h3>
                      <p class="minimal-company">${edu.institution}</p>
                      <p class="minimal-date">${edu.year}</p>
                    </div>
                  `).join('')}
                </section>
                ` : ''}

                ${cv.skills.length > 0 ? `
                <section>
                  <h2 class="minimal-section-title">Skills</h2>
                  <div>
                    ${cv.skills.filter(skill => skill.trim()).map(skill => `
                      <span class="minimal-skill">${skill}</span>
                    `).join('')}
                  </div>
                </section>
                ` : ''}
              </div>

              ${cv.references.length > 0 ? `
              <section>
                <h2 class="minimal-section-title">References</h2>
                <div class="minimal-grid">
                  ${cv.references.map(ref => `
                    <div class="minimal-ref">
                      <h4 class="minimal-ref-name">${ref.name}</h4>
                      <div class="minimal-ref-details">
                        <p>${ref.position}</p>
                        <p>${ref.company}</p>
                        <p>${ref.phone} | ${ref.email}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </section>
              ` : ''}
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

  private generateProfessionalSections(cv: CVData): string {
    let html = '';

    // Experience Section
    if (cv.experience.length > 0) {
      html += `
        <section class="mb-8">
          <h2 class="prof-section-title">Professional Experience</h2>
          ${cv.experience.map(exp => `
            <div class="mb-6" style="margin-bottom: 24px;">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 style="font-size: 20px; font-weight: 600; color: #1f2937;">${exp.position}</h3>
                  <p class="prof-company">${exp.company}</p>
                </div>
                <div class="prof-date">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;"><path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-8H19V2h-2v1H7V2H5v1H4.5C3.12 3 2 4.12 2 5.5v14C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-14C22 4.12 20.88 3 19.5 3z"/></svg>
                  ${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}
                </div>
              </div>
              ${exp.responsibilities.length > 0 ? `
                <ul class="list-disc list-inside ml-4" style="color: #374151; margin-top: 12px;">
                  ${exp.responsibilities.map(resp => `
                    <li style="margin-bottom: 4px; font-size: 14px;">
                      <span style="font-weight: 500;">${resp.heading}:</span> ${resp.description}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </section>
      `;
    }

    // Education Section
    if (cv.education.length > 0) {
      html += `
        <section class="mb-8">
          <h2 class="prof-section-title">Education</h2>
          ${cv.education.map(edu => `
            <div class="mb-4" style="margin-bottom: 16px;">
              <h3 style="font-size: 18px; font-weight: 600; color: #1f2937;">${edu.qualification}</h3>
              <p class="prof-company">${edu.institution}</p>
              <p style="color: #6b7280; font-size: 14px;">${edu.year}</p>
            </div>
          `).join('')}
        </section>
      `;
    }

    return html;
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