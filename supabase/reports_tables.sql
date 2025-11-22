-- Add status field to students table
alter table public.students 
add column if not exists status text default 'active' check (status in ('active', 'inactive'));

-- Create contact_logs table
create table if not exists public.contact_logs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  contacted_by uuid references public.profiles(id) on delete set null,
  contact_type text not null check (contact_type in ('phone', 'email', 'in_person', 'other')),
  notes text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_logs enable row level security;

-- Policies for contact_logs
create policy "Contact logs are viewable by authenticated users"
  on public.contact_logs for select
  using (auth.role() = 'authenticated');

create policy "Teachers and admins can insert contact logs"
  on public.contact_logs for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('ADMIN', 'TEACHER')
    )
  );

create policy "Contact logs are updatable by creator or admin"
  on public.contact_logs for update
  using (
    contacted_by = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

-- Update existing students to have 'active' status if null
update public.students set status = 'active' where status is null;

-- Create index for better performance
create index if not exists idx_students_status on public.students(status);
create index if not exists idx_contact_logs_student on public.contact_logs(student_id);
create index if not exists idx_contact_logs_created on public.contact_logs(created_at desc);


