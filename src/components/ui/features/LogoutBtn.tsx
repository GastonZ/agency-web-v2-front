import React from "react";
import { LogOut } from "lucide-react";

interface LogoutBtnProps {
    onLogout?: () => void;
    redirectTo?: string;
}

const LogoutBtn: React.FC<LogoutBtnProps> = ({
    onLogout,
    redirectTo = "/auth",
}) => {
    const handleLogout = () => {
        localStorage.removeItem("aiaToken");

        localStorage.removeItem("user");
        sessionStorage.clear();

        if (onLogout) {
            onLogout();
        }

        window.location.href = redirectTo;
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Logout"
            type="button"
        >
            <LogOut size={20} />
        </button>
    );
};

export default LogoutBtn;