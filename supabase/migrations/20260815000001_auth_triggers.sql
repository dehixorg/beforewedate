-- Migration: 20260815000001_auth_triggers.sql
-- Description: Enforce 18+ age requirement and sync public.users table on signup.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  dob_str TEXT;
  dob_date DATE;
  user_age_years INT;
BEGIN
  -- Extract dob from raw_user_meta_data
  dob_str := new.raw_user_meta_data->>'dob';
  
  -- If dob is not provided, block the signup.
  IF dob_str IS NULL OR dob_str = '' THEN
    RAISE EXCEPTION 'Date of birth is required for sign up.';
  END IF;

  -- Attempt to cast to DATE
  BEGIN
    dob_date := dob_str::DATE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid date of birth format. Must be YYYY-MM-DD.';
  END;

  -- Calculate age in years
  user_age_years := DATE_PART('year', AGE(CURRENT_DATE, dob_date));

  -- Hard-block if under 18
  IF user_age_years < 18 THEN
    RAISE EXCEPTION 'You must be at least 18 years old to use this application.';
  END IF;

  -- 2. Insert into public.users
  -- The user's phone is required in the public table
  INSERT INTO public.users (id, phone, status, verified, face_verified, trust_score)
  VALUES (
    new.id,
    new.phone,
    'dating',
    FALSE,
    FALSE,
    50
  );

  RETURN new;
END;
$$;

-- 3. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
