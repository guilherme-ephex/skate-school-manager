# Atualização da Edge Function super-endpoint

## Adicione este código na sua Edge Function

Cole este código no seu arquivo `index.ts` da Edge Function `super-endpoint`. Ele adiciona a funcionalidade de criar usuários:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const requestBody = await req.json()
    const { action, data } = requestBody

    // Handle different actions
    if (action === 'createUser') {
      // Check if user is admin
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'ADMIN') {
        throw new Error('Only admins can create users')
      }

      const { email, password, full_name, role, phone, specialty } = data

      if (!email || !password || !full_name || !role) {
        throw new Error('Missing required fields: email, password, full_name, role')
      }

      // Create admin client with service role key
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Create the user with admin privileges
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Create the profile
      const { data: profileData, error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name,
          role,
          phone: phone || null,
          specialty: specialty || null
        })
        .select()
        .single()

      if (profileInsertError) {
        // If profile creation fails, delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw profileInsertError
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          profile: profileData 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // If action is not recognized, return error
    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

## Passos para atualizar:

1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions** → **super-endpoint**
3. Clique na aba **Code**
4. **Substitua todo o código** pelo código acima
5. Clique em **Deploy updates**
6. Aguarde o deploy completar

## O que mudou:

- ✅ Adicionado suporte para `action: 'createUser'`
- ✅ Validação de admin antes de criar usuário
- ✅ Criação de usuário com email confirmado
- ✅ Criação automática do perfil
- ✅ Rollback se algo falhar
- ✅ CORS configurado corretamente

Após fazer o deploy, teste novamente criar um usuário pelo painel!
