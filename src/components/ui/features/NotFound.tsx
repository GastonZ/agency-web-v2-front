import React from "react";
import { useTranslation } from "react-i18next";

const NotFound: React.FC = () => {

    const { t } = useTranslation('translations');

    return (

        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ">
            <div className="bg-white rounded-xl shadow-2xl p-10 flex flex-col items-center">
                <svg
                    className="w-24 h-24 text-red-500 mb-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                    />
                </svg>
                <h1 className="text-5xl font-extrabold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-6">{t("not_found_message")}</p>
                <a
                    href="/"
                    className="px-6 py-2 bg-black text-white rounded-lg shadow transition"
                >
                   {t("go_home")}
                </a>
            </div>
        </div>
    )
};

export default NotFound;