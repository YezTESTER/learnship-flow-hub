import jsPDF from 'jspdf';

interface FeedbackData {
  learnerName: string;
  month: number;
  year: number;
  status: string;
  submittedAt: string | null;
  dueDate: string;
  submissionData: Record<string, any> | null;
  mentorRating: number | null;
  mentorComments: string | null;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone_number: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  race: string | null;
  nationality: string | null;
  employer_name: string | null;
  learnership_program: string | null;
  start_date: string | null;
  end_date: string | null;
  compliance_score: number | null;
  points: number | null;
  status: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
}

export class AdminPDFGenerator {
  async generateFeedbackPDF(feedback: FeedbackData): Promise<void> {
    const pdf = new jsPDF();
    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Feedback Report', margin, yPos);
    yPos += 15;

    // Learner Info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Learner: ${feedback.learnerName}`, margin, yPos);
    yPos += 8;
    
    const monthName = new Date(feedback.year, feedback.month - 1).toLocaleString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    pdf.text(`Period: ${monthName}`, margin, yPos);
    yPos += 8;

    pdf.text(`Status: ${feedback.status}`, margin, yPos);
    yPos += 8;

    if (feedback.submittedAt) {
      pdf.text(`Submitted: ${new Date(feedback.submittedAt).toLocaleDateString()}`, margin, yPos);
      yPos += 8;
    }

    pdf.text(`Due Date: ${new Date(feedback.dueDate).toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Rating
    if (feedback.mentorRating) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rating: ${'★'.repeat(feedback.mentorRating)}${'☆'.repeat(3 - feedback.mentorRating)}`, margin, yPos);
      yPos += 12;
    }

    // Submission Data
    if (feedback.submissionData) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Feedback Responses', margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      Object.entries(feedback.submissionData).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const valueStr = String(value ?? '');

        // Wrap text if too long
        const lines = pdf.splitTextToSize(`${label}: ${valueStr}`, contentWidth);
        
        // Check if we need a new page
        if (yPos + (lines.length * 7) > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          yPos = 20;
        }

        lines.forEach((line: string) => {
          pdf.text(line, margin, yPos);
          yPos += 7;
        });
        yPos += 3;
      });
    }

    // Manager Comments
    if (feedback.mentorComments) {
      yPos += 5;
      
      // Check if we need a new page
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Manager Comments', margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const commentLines = pdf.splitTextToSize(feedback.mentorComments, contentWidth);
      commentLines.forEach((line: string) => {
        if (yPos > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += 7;
      });
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${pageCount} - Generated ${new Date().toLocaleDateString()}`,
        margin,
        pdf.internal.pageSize.getHeight() - 10
      );
    }

    const fileName = `Feedback_${feedback.learnerName.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  }

  async generateProfilePDF(profile: ProfileData): Promise<void> {
    const pdf = new jsPDF();
    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Title
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Learner Profile', margin, yPos);
    yPos += 15;

    // Name
    pdf.setFontSize(16);
    pdf.text(profile.full_name, margin, yPos);
    yPos += 12;

    // Contact Information Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact Information', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const addField = (label: string, value: any) => {
      if (value) {
        pdf.text(`${label}: ${value}`, margin + 5, yPos);
        yPos += 7;
      }
    };

    addField('Email', profile.email);
    addField('Phone', profile.phone_number);
    addField('Address', profile.address);
    yPos += 5;

    // Personal Details Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Personal Details', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    addField('ID Number', profile.id_number);
    addField('Date of Birth', profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null);
    addField('Gender', profile.gender);
    addField('Race', profile.race);
    addField('Nationality', profile.nationality);
    yPos += 5;

    // Learnership Details Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Learnership Details', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    addField('Employer', profile.employer_name);
    addField('Program', profile.learnership_program);
    addField('Start Date', profile.start_date ? new Date(profile.start_date).toLocaleDateString() : null);
    addField('End Date', profile.end_date ? new Date(profile.end_date).toLocaleDateString() : null);
    addField('Status', profile.status);
    yPos += 5;

    // Performance Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    if (profile.compliance_score !== null) {
      addField('Compliance Score', `${profile.compliance_score.toFixed(1)}%`);
    }
    addField('Points', profile.points);
    yPos += 5;

    // Emergency Contact Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Emergency Contact', margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    addField('Name', profile.emergency_contact);
    addField('Phone', profile.emergency_phone);

    // Footer
    pdf.setFontSize(9);
    pdf.text(
      `Generated ${new Date().toLocaleDateString()}`,
      margin,
      pdf.internal.pageSize.getHeight() - 10
    );

    const fileName = `Profile_${profile.full_name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  }
}

export const adminPdfGenerator = new AdminPDFGenerator();
