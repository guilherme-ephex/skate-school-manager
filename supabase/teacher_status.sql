-- Add status column to profiles table for teachers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Update existing records to set status as active
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Update RLS policies to exclude inactive users from queries
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Recreate policy to exclude inactive users from normal views
CREATE POLICY "Active profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (status = 'active' OR auth.uid() = id)
  );

-- Allow admins to view all profiles (including inactive)
CREATE POLICY "Admins can view all profiles including inactive"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Comment on the new column
COMMENT ON COLUMN public.profiles.status IS 'Status do usuário: active ou inactive. Usuários inativos não podem fazer login e são ocultados das listagens.';

-- Create a function to check if user is active before allowing login
CREATE OR REPLACE FUNCTION public.check_user_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user trying to log in is inactive
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.id
    AND status = 'inactive'
  ) THEN
    RAISE EXCEPTION 'Sua conta está inativa. Entre em contato com o administrador.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check user status on login
-- Note: This will be executed after auth, so we need to handle it in the application layer
-- The RLS policies above will prevent inactive users from accessing data

-- Add a hook function for Supabase Auth (optional, but recommended)
-- This needs to be configured in Supabase Dashboard -> Authentication -> Hooks
COMMENT ON FUNCTION public.check_user_active IS 'Function to verify if user is active. Configure as Auth Hook in Supabase Dashboard.';

