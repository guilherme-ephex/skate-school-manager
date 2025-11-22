-- Create storage bucket for app files (logos, etc)
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;

-- Enable RLS for storage
create policy "Public files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'public' );

create policy "Only admins can upload public files"
  on storage.objects for insert
  with check (
    bucket_id = 'public' 
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Only admins can update public files"
  on storage.objects for update
  using (
    bucket_id = 'public'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );

create policy "Only admins can delete public files"
  on storage.objects for delete
  using (
    bucket_id = 'public'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ADMIN'
    )
  );


