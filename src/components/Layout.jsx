import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="ml-48 min-h-screen">
        <main className="px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
