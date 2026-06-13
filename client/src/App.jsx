import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ResumesPage from './pages/ResumesPage';
import DSAPage from './pages/DSAPage';
import InterviewsPage from './pages/InterviewsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resumes" 
          element={
            <ProtectedRoute>
              <ResumesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dsa" 
          element={
            <ProtectedRoute>
              <DSAPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/interviews" 
          element={
            <ProtectedRoute>
              <InterviewsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
