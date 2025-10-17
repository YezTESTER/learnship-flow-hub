-- Fix mentor-learner assignment system without causing RLS policy recursion

-- Create a simpler function for assigning learners to mentors
-- This avoids the recursive policy issue by using a security definer function
CREATE OR REPLACE FUNCTION public.assign_learner_to_mentor(learner_uuid UUID, mentor_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the learner's mentor_id directly
  UPDATE public.profiles 
  SET mentor_id = mentor_uuid
  WHERE id = learner_uuid AND role = 'learner';
END;
$$;

-- Create a function for unassigning learners from a mentor
CREATE OR REPLACE FUNCTION public.unassign_learner_from_mentor(learner_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear the learner's mentor_id
  UPDATE public.profiles 
  SET mentor_id = NULL
  WHERE id = learner_uuid AND role = 'learner';
END;
$$;

-- Create a function for bulk assigning learners to a mentor
CREATE OR REPLACE FUNCTION public.bulk_assign_learners_to_mentor(learner_uuids UUID[], mentor_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First unassign all learners from this mentor
  UPDATE public.profiles 
  SET mentor_id = NULL
  WHERE mentor_id = mentor_uuid AND role = 'learner';
  
  -- Then assign the specified learners to this mentor
  UPDATE public.profiles 
  SET mentor_id = mentor_uuid
  WHERE id = ANY(learner_uuids) AND role = 'learner';
END;
$$;