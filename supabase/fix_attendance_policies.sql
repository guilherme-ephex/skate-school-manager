-- Verificar se as RLS policies permitem inserir/atualizar is_cancelled
-- Este script verifica e corrige as policies da tabela attendance

-- 1. Verificar policies atuais (execute para debug)
-- SELECT * FROM pg_policies WHERE tablename = 'attendance';

-- 2. Garantir que as policies permitam inserção e update de todos os campos
-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance for their classes" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance for their classes" ON public.attendance;

-- Recriar policy de INSERT permitindo todos os campos
CREATE POLICY "Teachers and admins can insert attendance"
ON public.attendance
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEACHER')
    )
);

-- Recriar policy de UPDATE permitindo todos os campos
CREATE POLICY "Teachers and admins can update attendance"
ON public.attendance
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEACHER')
    )
);

-- Policy de SELECT
CREATE POLICY "Authenticated users can view attendance"
ON public.attendance
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy de DELETE (apenas admins)
CREATE POLICY "Only admins can delete attendance"
ON public.attendance
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
);

