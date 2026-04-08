import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Receipts from './pages/Receipts';
import Payments from './pages/Payments';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:clientId" element={<ClientDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
