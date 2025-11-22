-- Create app_settings table for customization
create table if not exists public.app_settings (
  id uuid default gen_random_uuid() primary key,
  setting_key text unique not null,
  setting_value text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.app_settings enable row level security;

-- Policies
create policy "Settings are viewable by everyone"
  on public.app_settings for select
  using (true);

create policy "Only admins can update settings"
  on public.app_settings for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Only admins can insert settings"
  on public.app_settings for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Insert default settings
insert into public.app_settings (setting_key, setting_value)
values 
  ('app_name', 'Skate School Manager'),
  ('app_logo_url', null)
on conflict (setting_key) do nothing;

-- Create index for better performance
create index if not exists idx_app_settings_key on public.app_settings(setting_key);

