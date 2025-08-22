import { useEffect, useState } from "react";
import { setTheme } from "../../utils/helper";
import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) ?? "system";
  });

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  const { t } = useTranslation("translations");

  return (
    <div
      className={[
        "inline-flex items-center gap-2 p-1 rounded-xl",
        "border border-white/20 dark:border-white/10",
        "bg-white/30 dark:bg-neutral-900/40",
        "backdrop-blur-md supports-[backdrop-filter]:bg-white/20",
        "shadow-sm",
      ].join(" ")}
    >
      {(["light", "dark", "system"] as Theme[]).map((x) => {
        const active = theme === x;

        const icon =
          x === "light" ? (
            <Sun className="h-4 w-4" />
          ) : x === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          );

        const label =
          x === "light"
            ? t("light_mode")
            : x === "dark"
            ? t("dark_mode")
            : t("system_mode");

        return (
          <button
            key={x}
            onClick={() => setLocal(x)}
            className={[
              "px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
              active
                ? "bg-emerald-400/20 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/50 shadow-inner"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/30 dark:hover:bg-neutral-800/40",
            ].join(" ")}
          >
            <span className="sm:hidden">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
