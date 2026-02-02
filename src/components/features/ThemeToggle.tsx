import { useEffect } from "react";
import { setTheme } from "../../utils/helper";

type Theme = "light" | "dark" | "system";

function getDomainTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const host = window.location.hostname.toLowerCase();

  // datacivis => siempre dark
  if (host === "datacivis.com.ar" || host === "www.datacivis.com.ar") return "dark";

  // agency => siempre light
  if (host === "agency-web-v2-front.vercel.app") return "light";

  // fallback
  return "light";
}

export default function ThemeToggle() {
  useEffect(() => {
    const theme = getDomainTheme();

    setTheme(theme);
  }, []);

  return null;
}
