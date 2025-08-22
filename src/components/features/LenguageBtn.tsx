import React from "react";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";

const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "br", label: "Português", flag: "🇧🇷" },
];

export const LenguageBtn: React.FC = () => {
    const { i18n } = useTranslation();
    const [open, setOpen] = React.useState(false);

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    const handleChange = (code: string) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Flag size={18} className="text-black dark:text-white"/>
                <span className="text-black dark:text-white">{currentLang.flag}</span>
            </button>
            {open && (
                <ul
                    className="absolute left-0 mt-2 border border-gray-300 rounded-md shadow-lg list-none m-0 p-0 min-w-[120px] z-10"
                    role="listbox"
                >
                    {languages.map(lang => (
                        <li
                            key={lang.code}
                            className={`px-3 py-2 cursor-pointer flex items-center transition-all rounded-sm ${
                                i18n.language === lang.code ? "" : ""
                            } hover:bg-black hover:text-white hover:dark:bg-gray-100 hover:dark:text-black`}
                            onClick={() => handleChange(lang.code)}
                            role="option"
                            aria-selected={i18n.language === lang.code}
                        >
                            <span className="mr-2">{lang.flag}</span>
                            {lang.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LenguageBtn;
