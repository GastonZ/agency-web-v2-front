import React from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface LogoutBtnProps {
    onLogout?: () => void;
    redirectTo?: string;
}

const LogoutBtn: React.FC<LogoutBtnProps> = ({
    onLogout,
    redirectTo = "/auth",
}) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        if (onLogout) onLogout();
        // Keep SPA navigation (no hard refresh) so the UI can transition smoothly.
        navigate(redirectTo, { replace: true });
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center p-3 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
            title="Logout"
            type="button"
            >
            <LogOut size={20} />
        </button>
    );
};

export default LogoutBtn;