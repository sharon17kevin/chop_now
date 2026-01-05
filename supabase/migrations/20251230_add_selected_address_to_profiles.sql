-- Add selected_address_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_selected_address ON public.profiles(selected_address_id);

-- Migrate existing default addresses to selected addresses
UPDATE public.profiles p
SET selected_address_id = a.id
FROM public.addresses a
WHERE a.user_id = p.id
  AND a.is_default = true
  AND p.selected_address_id IS NULL;

-- Optional: Drop the is_default column and related index after migration
-- Uncomment these lines after testing the new system
-- DROP INDEX IF EXISTS idx_addresses_default;
-- ALTER TABLE public.addresses DROP COLUMN IF EXISTS is_default;
