import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import ClientHome from './pages/ClientHome.jsx';
import NewRequest from './pages/NewRequest.jsx';
import RequestsList from './pages/RequestsList.jsx';
import LoansList from './pages/LoansList.jsx';
import LoanDetail from './pages/LoanDetail.jsx';
import PaymentsList from './pages/PaymentsList.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import Custody from './pages/Custody.jsx';
import Users from './pages/Users.jsx';
import ApiDocs from './pages/ApiDocs.jsx';

const STAFF = ['empleado', 'admin'];

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/verificar" element={<VerifyOtp />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Portal del cliente (RBAC: rol cliente) */}
      <Route path="/app" element={<ProtectedRoute roles={['cliente']}><Layout /></ProtectedRoute>}>
        <Route index element={<ClientHome />} />
        <Route path="solicitar" element={<NewRequest />} />
        <Route path="solicitudes" element={<RequestsList />} />
        <Route path="prestamos" element={<LoansList />} />
        <Route path="prestamos/:id" element={<LoanDetail />} />
        <Route path="pagos" element={<PaymentsList />} />
        <Route path="notificaciones" element={<Notifications />} />
        <Route path="perfil" element={<Profile />} />
      </Route>

      {/* Panel del personal (RBAC: empleado / admin) */}
      <Route path="/panel" element={<ProtectedRoute roles={STAFF}><Layout /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="solicitudes" element={<RequestsList />} />
        <Route path="solicitudes/:id" element={<RequestDetail />} />
        <Route path="prestamos" element={<LoansList />} />
        <Route path="prestamos/:id" element={<LoanDetail />} />
        <Route path="custodia" element={<Custody />} />
        <Route path="pagos" element={<PaymentsList />} />
        <Route path="notificaciones" element={<Notifications />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="api-docs" element={<ApiDocs />} />
        <Route path="usuarios" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
