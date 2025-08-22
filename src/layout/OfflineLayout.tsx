import React from "react";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import LenguageBtn from "../components/features/LenguageBtn";
import ThemeToggle from "../components/features/ThemeToggle";

interface OfflineLayoutProps {
  children: ReactNode;
}

const OfflineLayout: React.FC<OfflineLayoutProps> = ({ children }) => {
  return (
    <div
      className={[
        "min-h-screen w-full relative overflow-hidden",
        "bg-gradient-to-br from-white via-emerald-50/40 to-neutral-200",
        "dark:from-neutral-950 dark:via-neutral-900/95 dark:to-emerald-950/80",
        "transition-colors",
      ].join(" ")}
    >
      <nav
        className="h-[5vh] flex items-center justify-center md:justify-end w-full mt-2 md:px-4 md:pr-7 md:pt-4"
        style={{ position: "absolute", top: 0, right: 0, left: 0 }}
      >
        <LenguageBtn />
        <button
          className="mx-2 text-2xl hover:opacity-80 transition-opacity"
          aria-label="Info"
        >
          <Info className="w-6 h-6 text-black dark:text-white" />
        </button>
        <ThemeToggle />
      </nav>

      <main className="min-h-screen grid place-content-center px-3 pt-10 pb-20 lg:pb-32 lg:px-6">
        {children}
      </main>

      <div className="absolute -top-20 -left-20 w-44 h-44 md:-top-32 md:-left-32 md:w-96 md:h-96 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-500/20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-40 h-40 md:w-72 md:h-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/20 pointer-events-none" />
    </div>
  );
};

export default OfflineLayout;
