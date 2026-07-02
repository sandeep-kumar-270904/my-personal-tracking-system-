import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OnboardingTour = () => {
  const { user, setUser } = useAuth();

  useEffect(() => {
    // Prevent tour if user is not loaded, has completed it, or screen is too small
    if (!user || user.hasCompletedOnboarding || localStorage.getItem('hasCompletedOnboarding') || window.innerWidth < 768) return;

    // Small delay to ensure elements are mounted
    const timer = setTimeout(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      const tour = driver({
        showProgress: true,
        allowClose: true,
        popoverClass: 'driverjs-theme',
        steps: [
          {
            popover: {
              title: 'Welcome to StudentTracker! 🚀',
              description: 'Your all-in-one placement prep hub. Let us show you around.',
              position: 'bottom'
            }
          },
          {
            element: '.tour-nav-applications',
            popover: {
              title: 'Job Tracker',
              description: 'Log and track all your job applications here. Move them across stages from Applied to Offer.',
              position: 'bottom'
            }
          },
          {
            element: '.tour-nav-dsa-tracker',
            popover: {
              title: 'DSA Command Center',
              description: 'Solve problems, track your streak, and view your progress by topic or difficulty.',
              position: 'bottom'
            }
          },
          {
            element: '.tour-nav-interviews',
            popover: {
              title: 'Interview Intelligence',
              description: 'Log interview feedback, see common questions, and let AI analyze your performance gaps.',
              position: 'bottom'
            }
          },
          {
            element: '.tour-nav-ai-analyzer',
            popover: {
              title: 'AI Analyzer',
              description: 'Get deep AI insights into your resume and application conversion rates.',
              position: 'bottom'
            }
          },
          {
            element: '.tour-nav-more',
            popover: {
              title: 'So Much More',
              description: 'Find Resumes, Offers, Mock Interviews, and the core PrepHub underneath the More menu.',
              position: 'bottom'
            }
          }
        ],
        onDestroyStarted: () => {
          if (!tour.hasNextStep() || confirm("Are you sure you want to skip the tour?")) {
            tour.destroy();
            // Mark complete on backend
            api.post('/auth/onboarding-complete').then(() => {
              if (setUser) {
                setUser({ ...user, hasCompletedOnboarding: true });
              }
            }).catch(err => console.error('Failed to complete onboarding', err));
          }
        }
      });

      tour.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, setUser]);

  return null;
};

export default OnboardingTour;
