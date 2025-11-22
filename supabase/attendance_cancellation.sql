-- Add cancellation fields to attendance table
alter table public.attendance 
add column if not exists is_cancelled boolean default false,
add column if not exists cancelled_reason text,
add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Create index for better performance on cancelled queries
create index if not exists idx_attendance_is_cancelled on public.attendance(is_cancelled);
create index if not exists idx_attendance_created_by on public.attendance(created_by);

-- Update existing records to have is_cancelled = false if null
update public.attendance set is_cancelled = false where is_cancelled is null;

-- Comment on columns for documentation
comment on column public.attendance.is_cancelled is 'Indica se a aula foi cancelada (não aconteceu)';
comment on column public.attendance.cancelled_reason is 'Motivo do cancelamento da aula';
comment on column public.attendance.created_by is 'ID do professor que registrou a chamada';

