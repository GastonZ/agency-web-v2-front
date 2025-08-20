import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth, checking } = useAuth();

  if (checking) return <div style={{ padding: 24 }}>Cargando…</div>;
  if (isAuth) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default PublicOnlyRoute;
