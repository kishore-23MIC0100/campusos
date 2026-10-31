import React, { lazy, Suspense } from "react";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LandingPage } from "./pages/LandingPage";
import { DedicatedLogin } from "./pages/auth/DedicatedLogin";
import { PortalGateway } from "./pages/auth/PortalGateway";
import { AppLayout } from "./components/layout/AppLayout";
const DashboardDispatcher = lazy(() =>
  import("./pages/dashboard/DashboardDispatcher").then((module) => ({
    default: module.DashboardDispatcher,
  })),
);
const StudentsPage = lazy(() =>
  import("./pages/students/StudentsPage").then((module) => ({
    default: module.StudentsPage,
  })),
);
const StudentDetailPage = lazy(() =>
  import("./pages/students/StudentDetailPage").then((module) => ({
    default: module.StudentDetailPage,
  })),
);
const TeachersPage = lazy(() =>
  import("./pages/teachers/TeachersPage").then((module) => ({
    default: module.TeachersPage,
  })),
);
const ParentsPage = lazy(() =>
  import("./pages/parents/ParentsPage").then((module) => ({
    default: module.ParentsPage,
  })),
);
const AttendancePage = lazy(() =>
  import("./pages/attendance/AttendancePage").then((module) => ({
    default: module.AttendancePage,
  })),
);
const HomeworkPage = lazy(() =>
  import("./pages/homework/HomeworkPage").then((module) => ({
    default: module.HomeworkPage,
  })),
);
const TimetablePage = lazy(() =>
  import("./pages/timetable/TimetablePage").then((module) => ({
    default: module.TimetablePage,
  })),
);
const LeavePage = lazy(() =>
  import("./pages/leave/LeavePage").then((module) => ({
    default: module.LeavePage,
  })),
);
const EventsPage = lazy(() =>
  import("./pages/events/EventsPage").then((module) => ({
    default: module.EventsPage,
  })),
);
const AnnouncementsPage = lazy(() =>
  import("./pages/announcements/AnnouncementsPage").then((module) => ({
    default: module.AnnouncementsPage,
  })),
);
const SpotlightPage = lazy(() =>
  import("./pages/spotlight/SpotlightPage").then((module) => ({
    default: module.SpotlightPage,
  })),
);
const PerformancePage = lazy(() =>
  import("./pages/performance/PerformancePage").then((module) => ({
    default: module.PerformancePage,
  })),
);
const SchoolManagementPage = lazy(() =>
  import("./pages/school/SchoolManagementPage").then((module) => ({
    default: module.SchoolManagementPage,
  })),
);
const UsersAndApprovalsPage = lazy(() =>
  import("./pages/admin/UsersAndApprovalsPage").then((module) => ({
    default: module.UsersAndApprovalsPage,
  })),
);
const RolesAndPermissionsPage = lazy(() =>
  import("./pages/admin/RolesAndPermissionsPage").then((module) => ({
    default: module.RolesAndPermissionsPage,
  })),
);
const AuditLogsPage = lazy(() =>
  import("./pages/admin/AuditLogsPage").then((module) => ({
    default: module.AuditLogsPage,
  })),
);
const ReportsPage = lazy(() =>
  import("./pages/reports/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const PayrollPage = lazy(() =>
  import("./pages/payroll/PayrollPage").then((module) => ({
    default: module.PayrollPage,
  })),
);
const StaffDirectoryPage = lazy(() =>
  import("./pages/staff/StaffDirectoryPage").then((module) => ({
    default: module.StaffDirectoryPage,
  })),
);
const StaffManagementPage = lazy(() =>
  import("./pages/staff/StaffManagementPage").then((module) => ({
    default: module.StaffManagementPage,
  })),
);
const AssessmentsPage = lazy(() =>
  import("./pages/assessments/AssessmentsPage").then((module) => ({
    default: module.AssessmentsPage,
  })),
);
const TransportPage = lazy(() =>
  import("./pages/transport/TransportPage").then((module) => ({
    default: module.TransportPage,
  })),
);
const AssessmentPortalPage = lazy(() =>
  import("./pages/assessments/AssessmentPortalPage").then((module) => ({
    default: module.AssessmentPortalPage,
  })),
);

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">
            Verifying Institutional Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const admin = ["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(user.role);
  const educator = admin || user.role === "TEACHER";
  const path = location.pathname;
  const adminOnly = [
    "/staff-management",
    "/payroll",
    "/school-management",
    "/admin",
  ];
  const educatorOnly = ["/students", "/teachers", "/parents", "/reports"];
  const staffRoutes = [
    "/dashboard",
    "/staff-services",
    "/leave",
    "/transport",
    "/events",
    "/announcements",
    "/settings",
  ];
  const matches = (routes: string[]) =>
    routes.some((route) => path === route || path.startsWith(`${route}/`));
  if (
    (!admin && matches(adminOnly)) ||
    (path === "/staff-services" && !educator && user.role !== "STAFF") ||
    (!educator && matches(educatorOnly)) ||
    (user.role === "STAFF" && !matches(staffRoutes))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const ProtectedStandaloneRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Preparing assessment portal…
      </div>
    );
  if (!user) return <Navigate to="/student/login" replace />;
  if (user.role !== "STUDENT") return <Navigate to="/assessments" replace />;
  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppErrorBoundary>
            <Suspense
              fallback={
                <div role="status" className="route-loading">
                  Opening your workspace…
                </div>
              }
            >
              <Routes>
                {/* Landing Experience with 3D Campus */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />

                {/* Institutional Portal Gateway (VTOP Style Hub) */}
                <Route path="/login" element={<PortalGateway />} />
                <Route path="/gateway" element={<PortalGateway />} />

                {/* Dedicated Login Experiences */}
                <Route
                  path="/admin/login"
                  element={<DedicatedLogin initialRole="admin" />}
                />
                <Route
                  path="/staff/login"
                  element={<DedicatedLogin initialRole="staff" />}
                />
                <Route
                  path="/teacher/login"
                  element={<DedicatedLogin initialRole="teacher" />}
                />
                <Route
                  path="/student/login"
                  element={<DedicatedLogin initialRole="student" />}
                />
                <Route
                  path="/parent/login"
                  element={<DedicatedLogin initialRole="parent" />}
                />

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
                  path="/payroll"
                  element={
                    <ProtectedRoute>
                      <PayrollPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff-management"
                  element={
                    <ProtectedRoute>
                      <StaffManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessments"
                  element={
                    <ProtectedRoute>
                      <AssessmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment-portal"
                  element={
                    <ProtectedStandaloneRoute>
                      <AssessmentPortalPage />
                    </ProtectedStandaloneRoute>
                  }
                />
                <Route
                  path="/assessment-portal/:assessmentId"
                  element={
                    <ProtectedStandaloneRoute>
                      <AssessmentPortalPage />
                    </ProtectedStandaloneRoute>
                  }
                />
                <Route
                  path="/transport"
                  element={
                    <ProtectedRoute>
                      <TransportPage />
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

                <Route
                  path="/staff-services"
                  element={
                    <ProtectedRoute>
                      <StaffDirectoryPage />
                    </ProtectedRoute>
                  }
                />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
