import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

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
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <motion.div 
        animate={{ 
          marginLeft: isSidebarCollapsed ? 80 : 256,
          width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)'
        }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col w-full md:w-auto ml-0 max-md:!ml-0 max-md:!w-full"
      >
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
