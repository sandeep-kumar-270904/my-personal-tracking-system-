import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ResumesPage from './pages/ResumesPage';
import DSAPage from './pages/DSAPage';
import InterviewsPage from './pages/InterviewsPage';
import NetworkPage from './pages/NetworkPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import OffersPage from './pages/OffersPage';
import ContestsPage from './pages/ContestsPage';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
        
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
        <Route 
          path="/network" 
          element={
            <ProtectedRoute>
              <NetworkPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/goals" 
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/offers" 
          element={
            <ProtectedRoute>
              <OffersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contests" 
          element={
            <ProtectedRoute>
              <ContestsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
