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
            className="flex items-center p-3 cursor-pointer hover:scale-110 transition-transform duration-200 ease-in-out"
            title="Logout"
            type="button"
            >
            <LogOut size={20} />
        </button>
    );
};

export default LogoutBtn;