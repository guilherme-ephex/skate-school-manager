import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Create a Supabase client with Service Role Key for admin actions
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get the user from the request
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', success: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Verify if the user is an admin
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'ADMIN') {
            return new Response(
                JSON.stringify({ error: 'Forbidden: Only admins can perform this action', success: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        const { action, data } = await req.json()

        if (action === 'createUser') {
            const { email, password, full_name, role, phone, specialty, avatar_url } = data

            if (!email || !password || !full_name || !role) {
                return new Response(
                    JSON.stringify({ error: 'Missing required fields', success: false }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            // Create the user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name }
            })

            if (createError) {
                return new Response(
                    JSON.stringify({ error: createError.message, success: false }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            if (!newUser.user) {
                return new Response(
                    JSON.stringify({ error: 'Failed to create user', success: false }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                )
            }

            // Upsert the profile
            // We use upsert to handle cases where a trigger might have already created the profile
            const { data: newProfile, error: profileCreateError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: newUser.user.id,
                    email,
                    full_name,
                    role,
                    phone,
                    specialty,
                    avatar_url,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (profileCreateError) {
                return new Response(
                    JSON.stringify({ error: `User created but profile failed: ${profileCreateError.message}`, success: false }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                )
            }

            return new Response(
                JSON.stringify({ success: true, profile: newProfile, user: newUser.user }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message, success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
