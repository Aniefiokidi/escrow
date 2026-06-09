import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AdminPanelPage from "./pages/AdminPanelPage";
import CreateTransactionPage from "./pages/CreateTransactionPage";
import DashboardPage from "./pages/DashboardPage";
import DisputePage from "./pages/DisputePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TransactionDetailsPage from "./pages/TransactionDetailsPage";

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transactions/new"
        element={
          <ProtectedLayout>
            <CreateTransactionPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transactions/:id"
        element={
          <ProtectedLayout>
            <TransactionDetailsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/disputes"
        element={
          <ProtectedLayout>
            <DisputePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <ProfilePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedLayout>
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
