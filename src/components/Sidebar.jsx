import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', to: '/', end: true },
  { label: 'Clients', to: '/clients' },
  { label: 'Calendar', to: '/calendar' },
  { label: 'Invoices', to: '/invoices' },
  { label: 'Receipts', to: '/receipts' },
];

const settingsItem = { label: 'Settings', to: '/settings' };

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-48 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Agency os
          </p>
          <h1 className="mt-1 text-base font-semibold text-slate-900">Operations Hub</h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="space-y-2">
          {navigationItems.map(({ label, to, end }) => (
            <SidebarLink key={to} label={label} to={to} end={end} />
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-200 px-3 py-5">
        <SidebarLink label={settingsItem.label} to={settingsItem.to} />
      </div>
    </aside>
  );
}

function SidebarLink({ label, to, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default Sidebar;
