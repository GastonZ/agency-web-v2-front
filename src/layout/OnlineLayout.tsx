import React, { useState } from "react";
import type { ReactNode } from "react";
import LenguageBtn from "../components/features/LenguageBtn";
import LogoutBtn from "../components/features/LogoutBtn";
import ThemeToggle from "../components/features/ThemeToggle";
import { SidebarNav, defaultNavItems } from "../components/main/SidebarNav";
import { Menu, X } from "lucide-react";
import { isSubAccountSession } from "../utils/helper";

interface OnlineLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

const SIDE_WIDTH = "w-64";

const OnlineLayout: React.FC<OnlineLayoutProps> = ({ children, currentPath }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSub = isSubAccountSession();
  const navItems = React.useMemo(() => {
    if (!isSub) return defaultNavItems;
    // Sub accounts: only Dashboard + My Campaigns
    return defaultNavItems.filter((it) => it.id === "home" || it.id === "myCampaigns");
  }, [isSub]);

  return (
    <div className="min-h-screen bg-gray-200 text-black dark:bg-neutral-950 dark:text-white flex">
      <div className="hidden lg:block">
        <SidebarNav
          items={navItems}
          currentPath={currentPath}
          widthClassName={SIDE_WIDTH}
          defaultCollapsed={false}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="relative w-full h-full">
            <SidebarNav
              items={navItems}
              currentPath={currentPath}
              widthClassName="w-full"
              defaultCollapsed={false}
              className="h-full"
              onClose={() => setMobileOpen(false)}
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <ThemeToggle />
            </div>
          </div>

          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 lg:justify-end border-b border-neutral-200 dark:border-neutral-800">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <LenguageBtn />
            <LogoutBtn />
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main
          className={`flex-1 px-4 pb-8 pt-4 lg:pt-6 ${
            SIDE_WIDTH ? "lg:pl-64" : "lg:pl-[72px]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default OnlineLayout;
