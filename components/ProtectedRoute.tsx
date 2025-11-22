import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">Carregando...</div>;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
