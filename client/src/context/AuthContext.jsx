
import {
  createContext,
  useContext,
  useState,
} from "react";
import { apiRequest } from "../api";

const AuthContext = createContext(null);

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Restore the session after a browser refresh.
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(getSavedUser);

  function saveSession(data) {
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  }

  async function register(name, email, password) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    saveSession(data);
    return data;
  }

  async function login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data.token) {
      throw new Error(
        "Login succeeded without a token. Check the login API response."
      );
    }

    saveSession(data);
    return data;
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }

  function logout() {
    setToken(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return (
    <AuthContext.Provider
      value={{
      token,
      user,
      register,
      login,
      logout,
      updateUser,
      setUser,
      }}
      >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}
