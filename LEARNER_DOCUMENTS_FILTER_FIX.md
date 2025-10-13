# Learner Documents Filter Fix

## Issue
Timesheet submissions (work_attendance_log and class_attendance_proof) were appearing in the "Documents" section of learner profiles in the Admin "All Learners" page. These documents should only appear in the dedicated "Timesheets" section.

## Solution
Filtered out office documents (timesheet submissions) from the "Documents" section display in the learner profile dialog.

## Changes Made

### File Modified
`src/components/admin/LearnersManagement.tsx`

### Specific Changes
1. Added filtering logic in the "Uploaded Documents" section to exclude office documents:
   - `work_attendance_log`
   - `class_attendance_proof`

2. Only personal documents and contract documents are now displayed in this section:
   - Personal documents: `qualifications`, `certified_id`, `certified_proof_residence`, `proof_bank_account`, `drivers_license`, `cv_upload`
   - Contract documents: `induction_form`, `popia_form`, `learner_consent_policy`, `employment_contract`, `learnership_contract`
   - Published CV documents

## Technical Details
The filtering is implemented by checking the document type against predefined categories and only displaying documents that belong to the "personal" or "contracts" categories, or are published CV documents.

## Testing
The fix has been implemented and tested to ensure:
1. Timesheet submissions no longer appear in the "Documents" section
2. Personal documents still appear correctly
3. Contract documents still appear correctly
4. Published CV documents still appear correctly
5. Unpublished CV documents are still properly filtered out

## Impact
This change improves the organization and clarity of the learner profile interface by ensuring that timesheet submissions are only viewed in the dedicated timesheet management sections.