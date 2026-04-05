import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="calendar" element={<Calendar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
