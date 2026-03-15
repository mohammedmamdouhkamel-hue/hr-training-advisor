import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import AppShell from '../components/layout/AppShell';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('../pages/auth/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/auth/NotFoundPage'));
const RoleDashboard = lazy(() => import('../pages/dashboard/RoleDashboard'));
const UploadResultsPage = lazy(() => import('../pages/upload/UploadResultsPage'));
const EmployeesPage = lazy(() => import('../pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('../pages/employees/EmployeeDetailPage'));
const TeamPage = lazy(() => import('../pages/employees/TeamPage'));
const BulkOperationsPage = lazy(() => import('../pages/employees/BulkOperationsPage'));
const MyPlanPage = lazy(() => import('../pages/training/MyPlanPage'));
const MyProgressPage = lazy(() => import('../pages/training/MyProgressPage'));
const RecommendationsPage = lazy(() => import('../pages/training/RecommendationsPage'));
const TrainingPoliciesPage = lazy(() => import('../pages/training/TrainingPoliciesPage'));
const AnalyticsPage = lazy(() => import('../pages/analytics/AnalyticsPage'));
const TeamAnalyticsPage = lazy(() => import('../pages/analytics/TeamAnalyticsPage'));
const PersonalAnalyticsPage = lazy(() => import('../pages/analytics/PersonalAnalyticsPage'));
const AuditLogPage = lazy(() => import('../pages/admin/AuditLogPage'));
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
const OrgChartPage = lazy(() => import('../pages/admin/OrgChartPage'));
const SystemConfigPage = lazy(() => import('../pages/admin/SystemConfigPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));

const LoadingFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif',
    background: 'var(--surface-bg, #0F172A)',
  }}>
    Loading...
  </div>
);

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<RoleDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Admin + HR */}
              <Route path="/employees" element={<RoleGuard roles={['admin', 'hr_coordinator']}><EmployeesPage /></RoleGuard>} />
              <Route path="/employees/:name" element={<RoleGuard roles={['admin', 'hr_coordinator', 'manager']}><EmployeeDetailPage /></RoleGuard>} />
              <Route path="/upload" element={<RoleGuard roles={['admin', 'hr_coordinator']}><UploadResultsPage /></RoleGuard>} />
              <Route path="/analytics" element={<RoleGuard roles={['admin', 'hr_coordinator']}><AnalyticsPage /></RoleGuard>} />
              <Route path="/bulk-operations" element={<RoleGuard roles={['admin', 'hr_coordinator']}><BulkOperationsPage /></RoleGuard>} />

              {/* Manager */}
              <Route path="/team" element={<RoleGuard roles={['manager']}><TeamPage /></RoleGuard>} />
              <Route path="/analytics/team" element={<RoleGuard roles={['manager']}><TeamAnalyticsPage /></RoleGuard>} />

              {/* Employee */}
              <Route path="/my-plan" element={<RoleGuard roles={['employee']}><MyPlanPage /></RoleGuard>} />
              <Route path="/my-progress" element={<RoleGuard roles={['employee']}><MyProgressPage /></RoleGuard>} />
              <Route path="/analytics/personal" element={<RoleGuard roles={['employee']}><PersonalAnalyticsPage /></RoleGuard>} />
              <Route path="/recommendations" element={<RoleGuard roles={['employee']}><RecommendationsPage /></RoleGuard>} />

              {/* Admin only */}
              <Route path="/admin/users" element={<RoleGuard roles={['admin']}><UserManagementPage /></RoleGuard>} />
              <Route path="/admin/org-chart" element={<RoleGuard roles={['admin', 'hr_coordinator']}><OrgChartPage /></RoleGuard>} />
              <Route path="/admin/config" element={<RoleGuard roles={['admin']}><SystemConfigPage /></RoleGuard>} />
              <Route path="/admin/audit-log" element={<RoleGuard roles={['admin']}><AuditLogPage /></RoleGuard>} />

              {/* HR Coordinator extras */}
              <Route path="/training-policies" element={<RoleGuard roles={['hr_coordinator']}><TrainingPoliciesPage /></RoleGuard>} />
              <Route path="/reports" element={<RoleGuard roles={['hr_coordinator']}><ReportsPage /></RoleGuard>} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
