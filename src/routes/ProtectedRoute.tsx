import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC = () => {
    const { isAuth, checking, refreshSession, logout } = useAuth();
    const [verifying, setVerifying] = useState(true);
    const location = useLocation();

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
        return <div style={{ padding: 24 }}>Verificando sesión…</div>;
    }

    if (!isAuth) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
