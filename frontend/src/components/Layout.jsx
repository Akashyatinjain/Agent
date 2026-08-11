import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './ui/Sidebar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#090d16]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
