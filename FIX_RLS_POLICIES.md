# SQL para Corrigir Políticas RLS - Criação de Usuários

Execute este SQL no **SQL Editor** do Supabase Dashboard:

## Passo 1: Acesse o SQL Editor

1. Vá para o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**

## Passo 2: Execute este SQL

```sql
-- Primeiro, vamos ver as políticas atuais
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Desabilitar RLS temporariamente para a tabela profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ou, se preferir manter RLS ativo, crie uma política que permite
-- a service role inserir perfis (recomendado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Criar políticas corretas

-- 1. Permitir que qualquer usuário autenticado veja todos os perfis
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT
    USING (true);

-- 2. Permitir que usuários criem seu próprio perfil durante signup
CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Permitir que admins façam qualquer operação
CREATE POLICY "Admins have full access" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Verificar se as políticas foram criadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
```

## Passo 3: Execute a Query

Clique em **Run** ou pressione `Ctrl+Enter`

## Alternativa: Desabilitar RLS (Menos Seguro)

Se você quiser uma solução rápida para testar (NÃO recomendado para produção):

```sql
-- ATENÇÃO: Isso remove toda a segurança da tabela profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## Depois de executar o SQL:

1. Volte para a aplicação
2. Tente criar um usuário novamente
3. Deve funcionar! ✅

## Se ainda der erro:

Verifique os logs da Edge Function no Supabase:
- Edge Functions → super-endpoint → Logs
- Procure por mensagens de erro detalhadas

Me avise qual mensagem aparece nos logs para que eu possa ajudar melhor!
