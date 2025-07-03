
-- Add new columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender TEXT,
ADD COLUMN race TEXT,
ADD COLUMN nationality TEXT,
ADD COLUMN languages TEXT[], -- Array to store multiple languages
ADD COLUMN has_disability BOOLEAN DEFAULT false,
ADD COLUMN disability_description TEXT,
ADD COLUMN area_of_residence TEXT,
ADD COLUMN has_drivers_license BOOLEAN DEFAULT false,
ADD COLUMN license_codes TEXT[], -- Array to store multiple license codes
ADD COLUMN has_own_transport BOOLEAN DEFAULT false,
ADD COLUMN public_transport_types TEXT[], -- Array for multiple transport types
ADD COLUMN receives_stipend BOOLEAN DEFAULT false,
ADD COLUMN stipend_amount DECIMAL(10,2);

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female')),
ADD CONSTRAINT check_race CHECK (race IN ('Black', 'Coloured', 'Indian', 'White', 'Asian')),
ADD CONSTRAINT check_nationality CHECK (nationality IN ('South African', 'Non-South African'));
