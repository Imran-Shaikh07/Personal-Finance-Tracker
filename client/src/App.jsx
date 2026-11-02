
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import TransactionHistory from "./pages/TransactionHistory";
import Chatbot from "./components/Chatbot";
import "./components/Chatbot.css";

function HomeRedirect() {
  const { token } = useAuth();

  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* All routes inside this parent are protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/transaction-history"
            element={<TransactionHistory />}
          />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>

      {/* Floating AI assistant for authenticated users */}
      <AuthenticatedChatbot />
    </>
  );
}

function AuthenticatedChatbot() {
  const { token } = useAuth();

  return token ? <Chatbot /> : null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
