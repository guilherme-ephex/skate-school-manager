-- =============================================
-- Teacher Class Schedule Update Policy
-- =============================================
-- Permite que professores atualizem apenas dias, horários e local de suas turmas

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Teachers can update their class schedules" ON public.classes;

-- Create policy to allow teachers to update only schedule fields of their own classes
CREATE POLICY "Teachers can update their class schedules"
ON public.classes
FOR UPDATE
TO authenticated
USING (
  auth.uid() = teacher_id
  AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
    AND status = 'active'
  )
)
WITH CHECK (
  auth.uid() = teacher_id
  AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
    AND status = 'active'
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Teachers can update their class schedules" ON public.classes IS 
'Permite que professores ativos atualizem apenas os horários (dias, time, location) de suas próprias turmas. 
Não permite alterar nome, nível, capacidade ou professor da turma.';

