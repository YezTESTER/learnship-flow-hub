# WPS Learnership Management System

## Project Overview

The WPS Learnership Management & Compliance Platform is a comprehensive system designed to manage the full lifecycle of learners in workplace-based learnerships across partner companies. Created by White Paper Systems (a division of White Paper Concepts Pty Ltd), this platform supports South African companies with HR compliance, B-BBEE scorecard enhancement, and cost-effective learnership implementation.

**URL**: https://lovable.dev/projects/275b079f-e029-4368-9b39-41c583e81ae8

## System Architecture

This project is built with:
- **Frontend**: React with TypeScript, Vite, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, storage, real-time subscriptions)
- **Deployment**: Lovable platform with automatic deployments

## User Roles & Permissions

### 1. Learner (Primary User)
- **Purpose**: Participants placed into learnership programmes
- **Capabilities**:
  - Complete comprehensive profile setup (personal info, emergency contacts, transport, financial details)
  - Submit bi-weekly timesheets (2 uploads per month instead of weekly)
  - Complete monthly feedback forms with self-evaluation and supervisor sign-off
  - Upload required documents (ID, CV, qualifications, bank letters)
  - Track progress through achievements and points system
  - View compliance dashboard with detailed breakdown
  - Access CV builder and publish CVs
  - Receive and respond to admin communications

### 2. WPS Admin / Coordinator (Internal Admin)
- **Purpose**: WPS compliance coordinators managing all learners
- **Capabilities**:
  - **Learner Management**: View all learners with detailed profiles, categorize learners, track compliance scores
  - **Points System**: Award points manually for exceptional performance, early submissions, leadership initiatives
  - **Communication**: Send targeted messages to learners, track message read status
  - **Compliance Monitoring**: View comprehensive compliance breakdowns, generate audit reports, track overdue items
  - **Analytics**: Access dashboard with key metrics, performance trends, predictive analytics for at-risk learners
  - **Document Management**: View and manage all uploaded documents, track submission requirements

### 3. Company / Client (Optional View)
- **Purpose**: Organizations hosting learners
- **Capabilities**:
  - Upload signed Annexure B (host agreement)
  - View learner progress (if access granted)
  - Optional login-based access

### 4. Supervisor / Mentor (Optional Role)
- **Purpose**: Workplace managers providing guidance and sign-off
- **Capabilities**:
  - Sign off on monthly learner feedback
  - Provide mentorship ratings and comments
  - Access mentor-specific dashboard

## Core Features & Modules

### 1. Intelligent Compliance & Achievement System

#### Multi-Factor Compliance Scoring (0-100%)
- **Monthly Feedback (40%)**: On-time submission rate for monthly self-evaluations
- **Timesheet Compliance (35%)**: Bi-weekly upload compliance (2 uploads per month)
- **Document Compliance (15%)**: Required documents completion rate
- **Engagement Score (10%)**: Based on achievements, profile completion, admin communication responses

#### Dynamic Points System
- **Base Points**: Awarded for completing required tasks
- **Performance Bonuses**: Extra points for early submissions, high compliance scores
- **Achievement Multipliers**: Streak bonuses for consistent performance
- **Admin Awards**: Manual point allocation for exceptional performance, leadership, initiative
- **Categories**: Manual Award, Exceptional Performance, Early Submission, Leadership, Initiative, Compliance Bonus

### 2. Bi-Weekly Timesheet System
- **Schedule**: Two timesheet uploads per month (every 2 weeks)
  - Week 1-2: Combined timesheet for first half of month
  - Week 3-4: Combined timesheet for second half of month
- **Benefits**: Reduced administrative burden, better compliance rates, simplified tracking
- **Compliance Tracking**: Automated monitoring of upload schedules and deadlines

### 3. Comprehensive Profile Management
Learners can manage extensive personal information including:
- **Personal Details**: Full name, ID number, date of birth, gender, race, nationality
- **Contact Information**: Phone, email, address, area of residence
- **Languages**: Multi-select from South African official languages
- **Disability Information**: Accessibility requirements and descriptions
- **Transport Details**: Driver's license, vehicle ownership, public transport preferences
- **Financial Information**: Stipend details and banking information
- **Emergency Contacts**: Full contact details for emergencies
- **Learnership Details**: Program information, employer, start/end dates

### 4. Document Management System
- **Required Documents**: ID documents, CVs, bank letters, qualifications
- **Annexure System**: Support for Annexures A-F for compliance auditing
- **File Storage**: Secure cloud storage with access controls
- **Tracking**: Upload dates, file versions, compliance status

### 5. Feedback & Evaluation System
- **Monthly Reports**: Required monthly submissions with multiple components:
  - Attendance ratings (1-5 scale)
  - Self-evaluation of performance
  - Mentorship quality assessment
  - Challenges and achievements description
  - Supervisor sign-off and comments
- **Compliance Tracking**: Automated deadline monitoring and reminder system
- **Historical Data**: Complete submission history for audit purposes

### 6. Advanced Admin Dashboard
- **Overview Metrics**: Total learners, compliance rates, submission statistics
- **Learner Management**: 
  - Complete profile views with all personal, contact, and programme details
  - Category-based organization system
  - Individual compliance deep-dives
  - Points and achievements tracking
- **Communication Tools**:
  - Targeted messaging system
  - Message read status tracking
  - Bulk notification capabilities
- **Analytics & Reporting**:
  - Performance trend analysis
  - Predictive analytics for at-risk learners
  - Exportable compliance reports for B-BBEE audits
  - Real-time dashboard updates

## Database Schema

### Core Tables
- **profiles**: Complete learner and admin information with all personal details
- **feedback_submissions**: Monthly feedback forms with compliance tracking
- **documents**: File storage references with metadata
- **achievements**: Points system with categorized awards
- **notifications**: Messaging system with read receipts
- **cvs**: CV builder data with publication status

### New Compliance Tables
- **compliance_factors**: Multi-component compliance scoring per learner/month
- **timesheet_schedules**: Bi-weekly timesheet tracking and requirements
- **performance_metrics**: Historical performance data for analytics
- **learner_categories**: Admin-defined categories for learner organization
- **learner_category_assignments**: Many-to-many relationship for categorization

### Functions & Triggers
- **calculate_comprehensive_compliance()**: Multi-factor compliance calculation
- **award_performance_points()**: Dynamic point allocation with bonuses/penalties
- **initialize_biweekly_timesheets()**: Automated timesheet schedule creation
- **update_compliance_score()**: Real-time compliance updates

## Key Compliance & Reporting Goals

### SETA Compliance
- Monthly learner reports captured per SETA standards
- Complete audit trails for all learner activities
- Signed host agreements (Annexure B) and learnership terms (Annexure A)
- Downloadable compliance packs per learner

### B-BBEE Enhancement
- Real-time learnership activity tracking
- Document evidence for B-BBEE scorecards
- Transformation progress monitoring
- Client-ready compliance reports

### Operational Efficiency
- Scalable management for 30-300+ learners
- Automated compliance tracking and alerts
- Reduced manual administrative overhead
- Real-time performance insights

## Security & Privacy (POPIA Compliance)

### Row Level Security (RLS)
- Learners can only access their own records
- Admins have full access with role-based permissions
- Secure file storage with appropriate access controls
- Encrypted data transmission and storage

### Data Protection
- POPIA-compliant data handling
- Secure file uploads with size and type validation
- Automatic data backup and recovery
- Audit logging for all data access

## Technical Implementation

### Authentication Flow
1. Supabase Auth handles user registration and login
2. Profile creation triggers automatic role assignment
3. RLS policies enforce data access permissions
4. Session management with automatic token refresh

### File Storage
1. Supabase Storage for secure file handling
2. Automatic file optimization and validation
3. CDN delivery for optimal performance
4. Backup and versioning support

### Real-time Features
1. Live compliance score updates
2. Instant notification delivery
3. Real-time dashboard metrics
4. Collaborative feedback systems

## Development & Deployment

### Local Development
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Deployment
- Automatic deployments through Lovable platform
- Production builds optimized for performance
- Environment variable management
- Custom domain support available

### Database Migrations
- Automated schema updates through Supabase
- Version-controlled migration history
- Rollback capabilities for schema changes
- Data integrity preservation

## Monitoring & Analytics

### Performance Tracking
- Application performance monitoring
- Database query optimization
- User engagement analytics
- System health dashboards

### Compliance Reporting
- Automated compliance score calculations
- Historical trend analysis
- Predictive analytics for intervention
- Export capabilities for external reporting

## Support & Maintenance

### User Support
- Comprehensive user documentation
- Video tutorials and walkthroughs
- In-app help and guidance
- Admin support tools

### System Maintenance
- Regular system updates and patches
- Database optimization and cleanup
- Security audits and improvements
- Performance monitoring and tuning

---

For technical support or feature requests, contact the development team through the [Lovable Project Dashboard](https://lovable.dev/projects/275b079f-e029-4368-9b39-41c583e81ae8).