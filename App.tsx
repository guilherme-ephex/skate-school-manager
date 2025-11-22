import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { Calendar } from './pages/Calendar';
import { Registration } from './pages/Registration';
import { Enrollment } from './pages/Enrollment';
import { Reports } from './pages/Reports';
import { Attendance } from './pages/Attendance';
import { AdminPanel } from './pages/AdminPanel';
import { Notices } from './pages/Notices';
import { Turmas } from './pages/Turmas';
import { AttendanceHistory } from './pages/AttendanceHistory';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { usePageMetadata } from './src/hooks/usePageMetadata';

const AppContent: React.FC = () => {
  // Hook para atualizar título e favicon dinamicamente
  usePageMetadata();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <Layout>
                <AdminDashboard />
              </Layout>
            }
          />
          <Route
            path="/register"
            element={
              <Layout>
                <Registration />
              </Layout>
            }
          />
          <Route
            path="/enrollment"
            element={
              <Layout>
                <Enrollment />
              </Layout>
            }
          />
          <Route
            path="/reports"
            element={
              <Layout>
                <Reports />
              </Layout>
            }
          />
          <Route
            path="/admin/panel"
            element={
              <Layout>
                <AdminPanel />
              </Layout>
            }
          />
          <Route
            path="/turmas"
            element={
              <Layout>
                <Turmas />
              </Layout>
            }
          />
          <Route
            path="/notices"
            element={
              <Layout>
                <Notices />
              </Layout>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <Layout>
                <TeacherDashboard />
              </Layout>
            }
          />
          <Route
            path="/attendance"
            element={
              <Layout>
                <Attendance />
              </Layout>
            }
          />
          <Route
            path="/attendance-history"
            element={
              <Layout>
                <AttendanceHistory />
              </Layout>
            }
          />

          {/* Shared Routes */}
          <Route
            path="/calendar"
            element={
              <Layout>
                <Calendar />
              </Layout>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;