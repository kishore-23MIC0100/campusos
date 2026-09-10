import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { DedicatedLogin } from './pages/auth/DedicatedLogin';
import { PortalGateway } from './pages/auth/PortalGateway';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardDispatcher } from './pages/dashboard/DashboardDispatcher';
import { StudentsPage } from './pages/students/StudentsPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { TeachersPage } from './pages/teachers/TeachersPage';
import { ParentsPage } from './pages/parents/ParentsPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { HomeworkPage } from './pages/homework/HomeworkPage';
import { TimetablePage } from './pages/timetable/TimetablePage';
import { LeavePage } from './pages/leave/LeavePage';
import { EventsPage } from './pages/events/EventsPage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { SpotlightPage } from './pages/spotlight/SpotlightPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { SchoolManagementPage } from './pages/school/SchoolManagementPage';
import { UsersAndApprovalsPage } from './pages/admin/UsersAndApprovalsPage';
import { RolesAndPermissionsPage } from './pages/admin/RolesAndPermissionsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Verifying Institutional Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Experience with 3D Campus */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Institutional Portal Gateway (VTOP Style Hub) */}
          <Route path="/login" element={<PortalGateway />} />
          <Route path="/gateway" element={<PortalGateway />} />

          {/* Dedicated Login Experiences */}
          <Route path="/admin/login" element={<DedicatedLogin initialRole="admin" />} />
          <Route path="/teacher/login" element={<DedicatedLogin initialRole="teacher" />} />
          <Route path="/student/login" element={<DedicatedLogin initialRole="student" />} />
          <Route path="/parent/login" element={<DedicatedLogin initialRole="parent" />} />

          {/* Protected Application Modules */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardDispatcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parents"
            element={
              <ProtectedRoute>
                <ParentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework"
            element={
              <ProtectedRoute>
                <HomeworkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute>
                <LeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/spotlight"
            element={
              <ProtectedRoute>
                <SpotlightPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute>
                <PerformancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/school-management"
            element={
              <ProtectedRoute>
                <SchoolManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Specific Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UsersAndApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute>
                <RolesAndPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
