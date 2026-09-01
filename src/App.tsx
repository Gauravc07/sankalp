import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupChoicePage } from './pages/SignupChoicePage'
import { SignupCustomerPage } from './pages/SignupCustomerPage'
import { SignupBuilderPage } from './pages/SignupBuilderPage'
import { SignupStaffPage } from './pages/SignupStaffPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CustomerLayout } from './pages/customer/CustomerLayout'
import { CustomerOverview } from './pages/customer/CustomerOverview'
import { CustomerConstruction } from './pages/customer/CustomerConstruction'
import { CustomerPayments } from './pages/customer/CustomerPayments'
import { CustomerDocuments } from './pages/customer/CustomerDocuments'
import { CustomerCompliance } from './pages/customer/CustomerCompliance'
import { CustomerRera } from './pages/customer/CustomerRera'
import { CustomerRequests } from './pages/customer/CustomerRequests'
import { CustomerSupport } from './pages/customer/CustomerSupport'
import { BuilderLayout } from './pages/builder/BuilderLayout'
import { BuilderOverview } from './pages/builder/BuilderOverview'
import { BuilderInsights } from './pages/builder/BuilderInsights'
import { BuilderProjectDetail } from './pages/builder/BuilderProjectDetail'
import { BuilderVendors } from './pages/builder/BuilderVendors'
import { BuilderContractors } from './pages/builder/BuilderContractors'
import { BuilderFAQ } from './pages/builder/BuilderFAQ'
import { BuilderStaff } from './pages/builder/BuilderStaff'
import { StaffLayout } from './pages/staff/StaffLayout'
import { StaffDashboard } from './pages/staff/StaffDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupChoicePage />} />
      <Route path="/signup/customer" element={<SignupCustomerPage />} />
      <Route path="/signup/builder" element={<SignupBuilderPage />} />
      <Route path="/signup/staff" element={<SignupStaffPage />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute role="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerOverview />} />
        <Route path="construction" element={<CustomerConstruction />} />
        <Route path="payments" element={<CustomerPayments />} />
        <Route path="documents" element={<CustomerDocuments />} />
        <Route path="compliance" element={<CustomerCompliance />} />
        <Route path="rera" element={<CustomerRera />} />
        <Route path="requests" element={<CustomerRequests />} />
        <Route path="support" element={<CustomerSupport />} />
      </Route>

      <Route
        path="/builder"
        element={
          <ProtectedRoute role="builder_admin">
            <BuilderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BuilderOverview />} />
        <Route path="insights" element={<BuilderInsights />} />
        <Route path="vendors" element={<BuilderVendors />} />
        <Route path="contractors" element={<BuilderContractors />} />
        <Route path="faq" element={<BuilderFAQ />} />
        <Route path="staff" element={<BuilderStaff />} />
        <Route path="projects/:projectId" element={<BuilderProjectDetail />} />
      </Route>

      <Route
        path="/staff"
        element={
          <ProtectedRoute role="site_staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboard />} />
      </Route>
    </Routes>
  )
}

export default App
