import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAppContextStorage, clearSession, getToken, saveToken } from "../utils/helper";
import { validateToken } from "../services/client";

type AuthContextType = {
  isAuth: boolean;
  checking: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ok = await validateToken(getToken());
        setIsAuth(ok);
        if (!ok) {
          clearSession();
          clearAppContextStorage();
        }
      } catch {
        clearSession();
        clearAppContextStorage();
        setIsAuth(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const login = async (token: string) => {
    saveToken(token);
    const ok = await validateToken(token);
    setIsAuth(ok);
    if (!ok) {
      clearSession();
      clearAppContextStorage();
    }
  };

  const logout = () => {
    clearSession();
    clearAppContextStorage();
    try {
      sessionStorage.clear();
    } catch {}
    setIsAuth(false);
  };

  const refreshSession = async () => {
    try {
      const ok = await validateToken(getToken());
      setIsAuth(ok);
      if (!ok) {
        clearSession();
        clearAppContextStorage();
      }
      return ok;
    } catch {
      clearSession();
      clearAppContextStorage();
      setIsAuth(false);
      return false;
    }
  };

  const value = useMemo(() => ({ isAuth, checking, login, logout, refreshSession }), [isAuth, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
