import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../src/hooks/useAppSettings';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { appName, logoUrl, loading: settingsLoading } = useAppSettings();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Define all possible menu items with their required permissions
  const allMenuItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', permission: 'view_dashboard', roles: ['ADMIN'] },
    { path: '/teacher/dashboard', icon: 'dashboard', label: 'Dashboard', permission: 'view_dashboard', roles: ['TEACHER'] },
    { path: '/enrollment', icon: 'group', label: 'Alunos', permission: 'view_students', roles: ['ADMIN', 'TEACHER'] },
    { path: '/register', icon: 'person_add', label: 'Cadastro', permission: 'edit_students', roles: ['ADMIN'] },
    { path: '/turmas', icon: 'groups', label: 'Turmas', permission: 'view_turmas', roles: ['ADMIN', 'TEACHER'] },
    { path: '/calendar', icon: 'calendar_month', label: 'Calendário', permission: 'view_calendar', roles: ['ADMIN', 'TEACHER'] },
    { path: '/notices', icon: 'campaign', label: 'Avisos', permission: 'manage_permissions', roles: ['ADMIN'] },
    { path: '/reports', icon: 'assessment', label: 'Relatórios', permission: 'view_reports', roles: ['ADMIN', 'TEACHER'] },
    { path: '/attendance', icon: 'checklist', label: 'Chamada', permission: 'view_attendance', roles: ['TEACHER'] },
    { path: '/attendance-history', icon: 'history', label: 'Histórico', permission: 'view_history', roles: ['ADMIN', 'TEACHER'] },
    { path: '/admin/panel', icon: 'admin_panel_settings', label: 'Administração', permission: 'manage_permissions', roles: ['ADMIN'] },
  ];

  // Filter menu items based on user role and permissions
  const menuItems = allMenuItems.filter(item =>
    user && item.roles.includes(user.role) && hasPermission(item.permission)
  );

  return (
    <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark transition-colors">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex-col justify-between border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4 hidden lg:flex z-50 transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-4xl">skateboarding</span>
            )}
            <h1 className="text-text-light dark:text-text-dark text-lg font-bold">
              {settingsLoading ? 'Carregando...' : appName}
            </h1>
          </div>

          <div className="flex items-center gap-3 mt-4 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="rounded-full size-10 object-cover"
              />
            ) : (
              <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-text-light dark:text-text-dark text-sm font-bold truncate">
                {user?.full_name || 'Usuário'}
              </h1>
              <p className="text-muted dark:text-muted-dark text-xs font-normal">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Professor'}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                  ? 'bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark'
                  : 'text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary-dark'
                  }`}
              >
                <span className={`material-symbols-outlined ${isActive(item.path) ? 'fill' : ''}`}>
                  {item.icon}
                </span>
                <p className={`text-sm font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>
                  {item.label}
                </p>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <p className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</p>
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium">Sair</p>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">skateboarding</span>
            <span className="font-bold text-lg text-text-light dark:text-text-dark">Skate School</span>
          </div>
          <button
            className="p-2 bg-white dark:bg-card-dark rounded-full shadow-sm"
            onClick={toggleMobileMenu}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`fixed left-0 top-0 h-screen w-64 flex-col justify-between border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4 flex lg:hidden z-50 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={appName}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-3xl">skateboarding</span>
                )}
                <h1 className="text-text-light dark:text-text-dark text-lg font-bold">
                  {settingsLoading ? '...' : appName}
                </h1>
              </div>
              <button onClick={closeMobileMenu} className="text-muted dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="rounded-full size-10 object-cover"
                />
              ) : (
                <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </span>
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <h1 className="text-text-light dark:text-text-dark text-sm font-bold truncate">
                  {user?.full_name || 'Usuário'}
                </h1>
                <p className="text-muted dark:text-muted-dark text-xs font-normal">
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Professor'}
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                    ? 'bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark'
                    : 'text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary-dark'
                    }`}
                >
                  <span className={`material-symbols-outlined ${isActive(item.path) ? 'fill' : ''}`}>
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium">
                    {item.label}
                  </p>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark space-y-2">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <p className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</p>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted dark:text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-danger transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium">Sair</p>
            </button>
          </div>
        </aside>

        {children}
      </main>
    </div>
  );
};