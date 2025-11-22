-- Add dark logo setting to app_settings
-- This allows administrators to upload separate logos for light and dark themes

-- Insert default dark logo setting (if it doesn't exist)
insert into public.app_settings (setting_key, setting_value)
values ('app_logo_dark_url', null)
on conflict (setting_key) do nothing;

