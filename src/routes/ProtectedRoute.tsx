import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const ProtectedRoute: React.FC = () => {
    const { isAuth, checking, refreshSession, logout } = useAuth();
    const [verifying, setVerifying] = useState(true);
    const location = useLocation();
    const { t } = useTranslation('translations');

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!checking) {
                const ok = await refreshSession();
                if (!ok) {
                    logout();
                }
            }
            if (mounted) setVerifying(false);
        })();
        return () => { mounted = false; };
    }, [checking]);

    if (checking || verifying) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center space-y-3">
                    <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{t("veryfing_session")}</p>
                </div>
            </div>
        );
    }

    if (!isAuth) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
