import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    role: 'ADMIN' | 'TEACHER';
    permissions: string[];
}

interface AuthContextType {
    session: Session | null;
    user: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (authUser: SupabaseUser) => {
        try {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role, status')
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;

            // Check if user is inactive
            if (profile.status === 'inactive') {
                await supabase.auth.signOut();
                alert('Sua conta está inativa. Entre em contato com o administrador.');
                setUser(null);
                return;
            }

            // Fetch user permissions based on role
            const { data: permissions, error: permError } = await supabase
                .from('role_permissions')
                .select('permission')
                .eq('role', profile.role)
                .eq('enabled', true);

            if (permError) throw permError;

            const userProfile: UserProfile = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: profile.full_name || 'Usuário',
                avatar_url: profile.avatar_url,
                role: profile.role,
                permissions: permissions.map(p => p.permission)
            };

            setUser(userProfile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchUserProfile(session.user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchUserProfile(session.user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        // Admins have all permissions by default
        if (user.role === 'ADMIN') return true;
        return user.permissions.includes(permission);
    };

    const value = {
        session,
        user,
        loading,
        signOut,
        hasPermission,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
