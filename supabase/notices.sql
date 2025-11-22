-- Create notices table
create table if not exists public.notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  type text not null check (type in ('maintenance', 'event', 'info')),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

-- Enable RLS
alter table public.notices enable row level security;

-- Policies
create policy "Notices are viewable by everyone"
  on public.notices for select
  using (true);

create policy "Only admins can insert notices"
  on public.notices for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Only admins can update notices"
  on public.notices for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Only admins can delete notices"
  on public.notices for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Insert some sample notices
insert into public.notices (title, content, type, active)
values 
  ('Manutenção na Mini Ramp', 'A Mini Ramp estará fechada para reparos nesta quinta-feira (20/06) até as 14h.', 'maintenance', true),
  ('Campeonato Interno', 'Campeonato interno dia 30/06. Inscrevam seus alunos!', 'event', true);

