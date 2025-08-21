import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { bindSystemThemeListener } from "../utils/helper";

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth, checking } = useAuth();

  const { t } = useTranslation('translations');

  bindSystemThemeListener()

  if (checking) return <div style={{ padding: 24 }}>{t("loading")}</div>;
  if (isAuth) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default PublicOnlyRoute;
