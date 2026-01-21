import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import ForgetPassword from './pages/auth/ForgetPassword'
import Dashboard from './pages/common/Dashboard'
import MainLayout from './layout/MainLayout'
import NotFound from './pages/common/NotFound'
import { AuthProvider } from './context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/companies" element={<Dashboard activeSection="Companies" />} />
          <Route path="/dashboard/engagements" element={<Dashboard activeSection="Engagements" />} />
          <Route path="/dashboard/compliance" element={<Dashboard activeSection="Compliance" />} />
          <Route path="/dashboard/templates" element={<Dashboard activeSection="Document Request Templates" />} />
          <Route path="/dashboard/settings" element={<Dashboard activeSection="Settings" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App