import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import ForgetPassword from './pages/auth/ForgetPassword'
import Dashboard from './pages/common/Dashboard'
import MainLayout from './layout/MainLayout'
import VerifyMFA from './pages/auth/VerifyMFA'
import ResetPassword from './pages/auth/ResetPassword'
import NotFound from './pages/common/NotFound'
import { AuthProvider } from './context/AuthContext'
import EngagementFullView from './pages/org-employee/EmployeeEngagement/EngagementFullView'
import WorkbookViewerPage from './pages/common/WorkbookViewerPage'
import Messages from './pages/messages/Messages'
import Notifications from './pages/common/Notifications'
import Settings from './pages/common/Settings'
import { Toaster } from 'sonner'

import { NotificationProvider } from './context/NotificationContext'

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster position="top-right" expand={true} richColors={true} />
        <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-mfa" element={<VerifyMFA />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/companies" element={<Dashboard activeSection="Companies" />} />
            <Route path="/dashboard/engagements" element={<Dashboard activeSection="Engagements" />} />
            <Route path="/dashboard/compliance" element={<Dashboard activeSection="Compliance" />} />
            <Route path="/dashboard/templates" element={<Dashboard activeSection="Document Request Templates" />} />
            <Route path="/dashboard/templates/create" element={<Dashboard activeSection="Create Template" />} />
            <Route path="/dashboard/templates/:id/edit" element={<Dashboard activeSection="Edit Template" />} />
            <Route path="/dashboard/templates/:id/view" element={<Dashboard activeSection="View Template" />} />
            <Route path="/dashboard/employees" element={<Dashboard activeSection="Employees" />} />
            <Route path="/dashboard/employees/create" element={<Dashboard activeSection="Create Employee" />} />
            <Route path="/dashboard/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/dashboard/support" element={<Messages isSingleChat={true} contextualChatId="support-chat" />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/procedure-prompts" element={<Dashboard activeSection="Procedure Prompt" />} />
            <Route path="/dashboard/procedure-prompts/create" element={<Dashboard activeSection="Create Procedure Prompt" />} />
            <Route path="/dashboard/procedure-prompts/:id/edit" element={<Dashboard activeSection="Edit Procedure Prompt" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/engagement-view/:id" element={<EngagementFullView />} />
          <Route path="/engagement-view/services/:serviceId" element={<EngagementFullView />} />
          <Route path="/workbook-viewer/:workbookId" element={<WorkbookViewerPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App