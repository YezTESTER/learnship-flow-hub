# WPS Learnership Management System - App Restoration Guide

## Issue Summary

The application was broken due to incorrect RLS (Row Level Security) policies that caused:
1. Users showing "U" on their names (avatar fallback issue due to missing full_name data)
2. Dashboards not loading properly
3. Mentor-learner assignment functionality not working
4. Infinite recursion errors in database policies

## Restoration Steps

### 1. Apply Rollback Migration
Run the following migration to restore the original working RLS policies:
- File: `supabase/migrations/20251017180000_rollback_broken_rls_policies.sql`

This migration will:
- Remove the problematic mentor visibility settings table
- Restore the original RLS policies for profiles, feedback_submissions, and documents tables
- Restore the original storage policies

### 2. Apply Fixed Mentor-Learner Assignment Migration
Run the following migration to implement a working mentor-learner assignment system:
- File: `supabase/migrations/20251017190000_fix_mentor_learner_assignment.sql`

This migration creates security definer functions that avoid RLS policy recursion:
- `assign_learner_to_mentor(learner_uuid, mentor_uuid)`
- `unassign_learner_from_mentor(learner_uuid)`
- `bulk_assign_learners_to_mentor(learner_uuids, mentor_uuid)`

### 3. Update Frontend Components

#### SystemSettings Component
- Updated to use the new `bulk_assign_learners_to_mentor` RPC function
- Removed direct profile updates that were causing RLS policy conflicts
- Added proper error handling

#### MentorDashboard Component
- Fixed the data fetching logic to properly retrieve assigned learners
- Resolved the issue where `learners.map` was being called before learners were loaded

## How the Fixed System Works

### Mentor-Learner Assignment
1. Admins can assign learners to mentors through the System Settings page
2. The assignment uses security definer functions that bypass RLS policies
3. Mentors can only see learners assigned to them (based on mentor_id field)
4. Admins can see all learners regardless of assignment

### Data Access Rules
- Learners can only see their own data
- Mentors can see data for learners assigned to them
- Admins can see all data
- These rules are enforced through RLS policies that don't cause recursion

## Testing the Restored System

1. Log in as an admin user
2. Navigate to System Settings
3. Assign learners to a mentor
4. Log in as that mentor
5. Verify that the mentor can see their assigned learners
6. Verify that the admin dashboard loads correctly
7. Verify that learner names display properly (not just "U")

## Preventing Future Issues

1. Always test RLS policy changes in a development environment first
2. Avoid complex JOINs in RLS policies that can cause recursion
3. Use security definer functions for administrative operations
4. Keep RLS policies simple and straightforward
5. Test mentor-learner assignment functionality after any policy changes

## Migration Order
Apply the migrations in this order:
1. `20251017180000_rollback_broken_rls_policies.sql`
2. `20251017190000_fix_mentor_learner_assignment.sql`

After applying these migrations and updating the frontend components, the application should be fully restored to working condition.