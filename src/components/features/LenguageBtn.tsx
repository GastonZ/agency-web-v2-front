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

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-md cursor-pointer
                   bg-white/80 dark:bg-neutral-900/60 backdrop-blur
                   hover:bg-white dark:hover:bg-neutral-900
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Flag size={18} className="text-black dark:text-white" />
        <span className="text-black dark:text-white">{currentLang.flag}</span>
      </button>

      {open && (
        <ul
          className="absolute left-0 mt-2 min-w-[160px] z-50 overflow-hidden
                     rounded-md border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-900
                     shadow-xl ring-1 ring-black/5 dark:ring-white/10"
          role="listbox"
        >
          {languages.map((lang) => {
            const selected = i18n.language === lang.code;
            return (
              <li
                key={lang.code}
                className={[
                  "px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors",
                  "text-neutral-900 dark:text-neutral-100",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  selected ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "",
                ].join(" ")}
                onClick={() => handleChange(lang.code)}
                role="option"
                aria-selected={selected}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LenguageBtn;
