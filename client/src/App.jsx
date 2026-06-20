import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AIAnalyzerPage from './pages/AIAnalyzerPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ResumesPage from './pages/ResumesPage';
import ResumeIntelligenceDashboard from './pages/ResumeIntelligenceDashboard';
import DSAPage from './pages/DSAPage';
import DSACommandCenter from './pages/DSACommandCenter';
import InterviewsV2Page from './pages/InterviewsV2Page';
import BehavioralStoryBank from './pages/BehavioralStoryBank';
import LiveNotesWidget from './pages/LiveNotesWidget';
import InterviewCommandCenter from './pages/InterviewCommandCenter';
import NetworkPage from './pages/NetworkPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import OffersPage from './pages/OffersPage';
import ContestsPage from './pages/ContestsPage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import PublicProfile from './pages/PublicProfile';
import ReviewPage from './pages/ReviewPage';
import JourneyPage from './pages/JourneyPage';
import TrainingHub from './pages/TrainingHub';

import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { user } = useContext(AuthContext);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#13141f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
      }} />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" /> : <ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/review/resume/:token" element={<ReviewPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="resumes/intelligence" element={<ResumeIntelligenceDashboard />} />
            <Route path="dsa" element={<DSAPage />} />
            <Route path="dsa/command-center" element={<DSACommandCenter />} />
            <Route path="interviews" element={<InterviewsV2Page />} />
            <Route path="interviews/stories" element={<BehavioralStoryBank />} />
            <Route path="interviews/command-center" element={<InterviewCommandCenter />} />
            <Route path="interviews/training" element={<TrainingHub />} />
            <Route path="interviews/:id/live-notes" element={<LiveNotesWidget />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="contests" element={<ContestsPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ai-analyzer" element={<AIAnalyzerPage />} />
            <Route path="journey" element={<JourneyPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
