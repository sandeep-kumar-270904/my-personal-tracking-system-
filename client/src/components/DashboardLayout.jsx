import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import BottomNavBar from './BottomNavBar';
import InstallPWA from './InstallPWA';
import DailyBriefModal from './dsa/v5/DailyBriefModal';
import Footer from './Footer';
import OnboardingTour from './prephub/OnboardingTour';
import KeyboardShortcuts from './KeyboardShortcuts';
import ErrorBoundary from './ErrorBoundary';

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="h-full flex flex-col min-h-full"
      >
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </motion.div>
    </AnimatePresence>
  );
};

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#010409] flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-6 overflow-y-auto pb-24 md:pb-0 flex flex-col">
        <ErrorBoundary>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </ErrorBoundary>
      </main>
      <BottomNavBar />
      <InstallPWA />
      <DailyBriefModal />
      <OnboardingTour />
      <KeyboardShortcuts />
    </div>
  );
};

export default DashboardLayout;
