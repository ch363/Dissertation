-- Migration: Add ON DELETE CASCADE to all foreign keys referencing auth.users(id)
-- This allows user deletion to automatically clean up related data
-- Run this on an existing database to update constraints without dropping tables

BEGIN;

-- Drop existing constraints and recreate with CASCADE
ALTER TABLE public.content_admins
  DROP CONSTRAINT IF EXISTS content_admins_user_id_fkey,
  ADD CONSTRAINT content_admins_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_answers
  DROP CONSTRAINT IF EXISTS onboarding_answers_user_id_fkey,
  ADD CONSTRAINT onboarding_answers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.module_completion
  DROP CONSTRAINT IF EXISTS module_completion_user_id_fkey,
  ADD CONSTRAINT module_completion_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_attempts
  DROP CONSTRAINT IF EXISTS lesson_attempts_user_id_fkey,
  ADD CONSTRAINT lesson_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress
  DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey,
  ADD CONSTRAINT user_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_responses
  DROP CONSTRAINT IF EXISTS user_responses_user_id_fkey,
  ADD CONSTRAINT user_responses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
