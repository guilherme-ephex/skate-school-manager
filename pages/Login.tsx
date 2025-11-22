import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppSettings } from '../src/hooks/useAppSettings';
import { useTheme } from '../contexts/ThemeContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { appName, logoUrl, logoDarkUrl, loading: settingsLoading } = useAppSettings();
  const { theme, toggleTheme } = useTheme();
  
  // Select logo based on current theme
  const currentLogo = theme === 'dark' && logoDarkUrl ? logoDarkUrl : logoUrl;
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

        // Fetch user's role and status from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/admin/dashboard'); // Fallback to admin dashboard
        } else {
          // Check if user is inactive
          if (profile.status === 'inactive') {
            await supabase.auth.signOut();
            setError('Sua conta está inativa. Entre em contato com o administrador.');
            return;
          }

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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-background-dark dark:via-background-dark dark:to-background-dark flex items-center justify-center p-4 transition-all relative overflow-hidden">
      {/* Decorative Elements - Light Theme Only */}
      {theme === 'light' && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gray-300/30 rounded-full blur-3xl"></div>
        </>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group z-10 ${
          theme === 'light' 
            ? 'bg-white/90 backdrop-blur-sm border border-white/20' 
            : 'bg-card-dark border border-border-dark'
        }`}
        aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      >
        {theme === 'dark' ? (
          <span className="material-symbols-outlined text-yellow-500 text-2xl group-hover:rotate-12 transition-transform">light_mode</span>
        ) : (
          <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-12 transition-transform">dark_mode</span>
        )}
      </button>

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        <div className="flex items-center gap-3 mb-8">
          {currentLogo ? (
            <div className={`p-2 rounded-xl ${theme === 'light' ? 'bg-white shadow-sm' : ''}`}>
              <img
                src={currentLogo}
                alt={appName}
                className="w-12 h-12 object-contain"
              />
            </div>
          ) : (
            <span className={`material-symbols-outlined text-5xl ${theme === 'light' ? 'text-primary' : 'text-primary dark:text-white'}`}>skateboarding</span>
          )}
          <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-primary dark:text-white'}`}>
            {settingsLoading ? 'Carregando...' : appName}
          </h1>
        </div>

        <h2 className={`text-2xl font-bold mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-text-light dark:text-white'}`}>
          {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta!'}
        </h2>

        <div className={`w-full rounded-2xl p-6 sm:p-8 shadow-2xl border transition-all ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-white/5 dark:backdrop-blur-sm border-white/10'
        }`}>
          {/* Google Login - Placeholder for now */}
          <button className={`flex items-center justify-center w-full h-12 rounded-lg text-sm font-bold transition-all mb-6 gap-2 opacity-50 cursor-not-allowed ${
            theme === 'light' 
              ? 'bg-gray-50 text-gray-500 border border-gray-200' 
              : 'bg-gray-700 text-gray-300'
          }`} disabled>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Entrar com Google (Em breve)
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`h-px flex-1 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>ou</p>
            <div className={`h-px flex-1 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${
              theme === 'light' 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-red-500/20 border-red-500 text-red-200'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-text-light dark:text-white'}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border h-12 px-4 transition-all focus:ring-2 focus:ring-offset-0 ${
                  theme === 'light' 
                    ? 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-primary focus:border-primary' 
                    : 'bg-white dark:bg-input-dark text-gray-900 dark:text-white border-border-light dark:border-border-dark focus:ring-primary focus:border-transparent'
                }`}
                placeholder="seuemail@exemplo.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-text-light dark:text-white'}`}>Senha</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border h-12 px-4 transition-all focus:ring-2 focus:ring-offset-0 ${
                    theme === 'light' 
                      ? 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-primary focus:border-primary' 
                      : 'bg-white dark:bg-input-dark text-gray-900 dark:text-white border-border-light dark:border-border-dark focus:ring-primary focus:border-transparent'
                  }`}
                  placeholder="********"
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <a href="#" className={`text-sm hover:underline self-end transition-colors ${
                theme === 'light' 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-blue-300 hover:text-blue-200'
              }`}>
                Esqueceu sua senha?
              </a>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-lg font-bold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                theme === 'light' 
                  ? 'bg-primary text-white hover:bg-primary/90' 
                  : 'bg-[#0f3c5c] text-white hover:bg-[#0A283D]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Carregando...
                </span>
              ) : (
                isSignUp ? 'Cadastrar' : 'Entrar'
              )}
            </button>
          </form>

          <p className={`text-sm text-center mt-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className={`font-bold hover:underline ml-1 transition-colors ${
                theme === 'light' 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-blue-300 hover:text-blue-200'
              }`}
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
