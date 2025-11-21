import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Verifique seu email para confirmar o cadastro!');
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Fetch user's role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/admin/dashboard'); // Fallback to admin dashboard
        } else {
          // Redirect based on role
          if (profile.role === 'TEACHER') {
            navigate('/teacher/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1A2B4C] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-white text-5xl">skateboarding</span>
          <h1 className="text-white text-3xl font-bold">Skate School</h1>
        </div>

        <h2 className="text-white text-2xl font-bold mb-6">
          {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta!'}
        </h2>

        <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Google Login - Placeholder for now */}
          <button className="flex items-center justify-center w-full bg-white text-gray-900 h-12 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors mb-6 gap-2 opacity-50 cursor-not-allowed" disabled>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Entrar com Google (Em breve)
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gray-600"></div>
            <p className="text-gray-400 text-sm">ou</p>
            <div className="h-px flex-1 bg-gray-600"></div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white rounded-lg border-none h-12 px-4 focus:ring-2 focus:ring-[#0f3c5c]"
                placeholder="seuemail@exemplo.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white rounded-lg border-none h-12 px-4 focus:ring-2 focus:ring-[#0f3c5c]"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <a href="#" className="text-blue-300 text-sm hover:underline self-end">Esqueceu sua senha?</a>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f3c5c] text-white h-12 rounded-lg font-bold hover:bg-[#0A283D] transition-colors mt-4 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-300 font-bold hover:underline ml-1"
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};