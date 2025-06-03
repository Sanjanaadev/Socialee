import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import { useState } from 'react';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background-dark">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                        transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="relative flex h-full">
          <div className="w-60 bg-background-dark flex flex-col">
            <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
          </div>
          <div 
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-background-dark">
          <div className="py-6">
            <div className="px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;