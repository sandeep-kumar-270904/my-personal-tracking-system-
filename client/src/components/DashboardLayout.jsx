import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
