import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupChoicePage } from './pages/SignupChoicePage'
import { SignupCustomerPage } from './pages/SignupCustomerPage'
import { SignupBuilderPage } from './pages/SignupBuilderPage'
import { SignupTeamPage } from './pages/SignupTeamPage'
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
import { BuilderTeam } from './pages/builder/BuilderTeam'
import { StaffLayout } from './pages/staff/StaffLayout'
import { StaffDashboard } from './pages/staff/StaffDashboard'
import { TeamLayout } from './pages/team/TeamLayout'
import { SiteEngineerDashboard } from './pages/team/SiteEngineerDashboard'
import { SalesDashboard } from './pages/team/SalesDashboard'
import { SupportDashboard } from './pages/team/SupportDashboard'
import { ComplianceDashboard } from './pages/team/ComplianceDashboard'
import { ProjectManagerDashboard } from './pages/team/ProjectManagerDashboard'

function RedirectPreservingSearch({ to }: { to: string }) {
  const location = useLocation()
  return <Navigate to={{ pathname: to, search: location.search }} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupChoicePage />} />
      <Route path="/signup/customer" element={<SignupCustomerPage />} />
      <Route path="/signup/builder" element={<SignupBuilderPage />} />
      <Route path="/signup/team" element={<SignupTeamPage />} />
      <Route path="/signup/staff" element={<RedirectPreservingSearch to="/signup/team" />} />

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
        <Route path="team" element={<BuilderTeam />} />
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

      <Route
        path="/team/site-engineer"
        element={
          <ProtectedRoute role="site_engineer">
            <TeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SiteEngineerDashboard />} />
      </Route>

      <Route
        path="/team/sales"
        element={
          <ProtectedRoute role="sales_rm">
            <TeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SalesDashboard />} />
      </Route>

      <Route
        path="/team/support"
        element={
          <ProtectedRoute role="support">
            <TeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SupportDashboard />} />
      </Route>

      <Route
        path="/team/compliance"
        element={
          <ProtectedRoute role="compliance_officer">
            <TeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ComplianceDashboard />} />
      </Route>

      <Route
        path="/team/pm"
        element={
          <ProtectedRoute role="project_manager">
            <TeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProjectManagerDashboard />} />
      </Route>
    </Routes>
  )
}

export default App
