import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Define all possible menu items with their required permissions
  const allMenuItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', permission: 'view_dashboard', roles: ['ADMIN'] },
    { path: '/teacher/dashboard', icon: 'dashboard', label: 'Dashboard', permission: 'view_dashboard', roles: ['TEACHER'] },
    { path: '/enrollment', icon: 'group', label: 'Alunos', permission: 'view_students', roles: ['ADMIN', 'TEACHER'] },
    { path: '/register', icon: 'person_add', label: 'Cadastro', permission: 'edit_students', roles: ['ADMIN'] },
    { path: '/turmas', icon: 'groups', label: 'Turmas', permission: 'view_turmas', roles: ['ADMIN', 'TEACHER'] },
    { path: '/calendar', icon: 'calendar_month', label: 'Calendário', permission: 'view_calendar', roles: ['ADMIN', 'TEACHER'] },
    { path: '/reports', icon: 'assessment', label: 'Relatórios', permission: 'view_reports', roles: ['ADMIN'] },
    { path: '/attendance', icon: 'checklist', label: 'Chamada', permission: 'view_attendance', roles: ['TEACHER'] },
    { path: '/attendance-history', icon: 'history', label: 'Histórico', permission: 'view_history', roles: ['ADMIN', 'TEACHER'] },
    { path: '/admin/panel', icon: 'admin_panel_settings', label: 'Administração', permission: 'manage_permissions', roles: ['ADMIN'] },
  ];

  // Filter menu items based on user role and permissions
  const menuItems = allMenuItems.filter(item =>
    user && item.roles.includes(user.role) && hasPermission(item.permission)
  );

  return (
    <div className="relative flex min-h-screen w-full bg-background-light">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex-col justify-between border-r border-border-light bg-card-light p-4 hidden lg:flex z-50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2">
            <span className="material-symbols-outlined text-primary text-4xl">skateboarding</span>
            <h1 className="text-text-light text-lg font-bold">Skate School</h1>
          </div>

          <div className="flex items-center gap-3 mt-4 mb-2 p-2 bg-gray-50 rounded-lg">
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
              <h1 className="text-text-light text-sm font-bold truncate">
                {user?.full_name || 'Usuário'}
              </h1>
              <p className="text-muted text-xs font-normal">
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
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-gray-100 hover:text-primary'
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

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted hover:bg-gray-100 hover:text-danger transition-colors"
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
            <span className="font-bold text-lg">Skate School</span>
          </div>
          <button className="p-2 bg-white rounded-full shadow-sm">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {children}
      </main>
    </div>
  );
};