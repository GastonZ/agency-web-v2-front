import React, { useState } from "react";
import type { ReactNode } from "react";
import LenguageBtn from "../components/features/LenguageBtn";
import LogoutBtn from "../components/features/LogoutBtn";
import ThemeToggle from "../components/features/ThemeToggle";
import { SidebarNav, type NavItem } from "../components/main/SidebarNav";
import { CreditCard, Factory, Folder, Home, Menu, MessageSquare, Settings, X } from "lucide-react";
import { isSubAccountSession } from "../utils/helper";
import { useTranslation } from "react-i18next";
import BillingStatusBanner from "../components/features/billing/BillingStatusBanner";
import BillingLimitModal from "../components/features/billing/BillingLimitModal";
import { getMyBillingSummary } from "../services/billing";
import type { BillingStatus } from "../services/types/billing-types";

interface OnlineLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

const SIDE_WIDTH = "w-64";

const OnlineLayout: React.FC<OnlineLayoutProps> = ({ children, currentPath }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | undefined>(undefined);

  const { t, i18n } = useTranslation("translations");
  const isSub = isSubAccountSession();

  const defaultNavItems: NavItem[] = React.useMemo(
    () => [
      { id: "home", label: t("dashboard_title"), href: "/", icon: Home },
      { id: "campaign", label: t("campaign_title"), href: "/campaign_selection", icon: Folder },
      { id: "myCampaigns", label: t("my_campaigns_title"), href: "/my_campaigns", icon: Factory },
      { id: "inbox", label: t("inbox_title"), href: "/inbox", icon: MessageSquare },
      /* { id: "billing", label: "Billing", href: "/billing/subscription", icon: CreditCard }, */
      { id: "settings", label: t("settings_title"), href: "/settings", icon: Settings },
    ],
    // Recompute labels when language changes.
    [i18n.resolvedLanguage] // o i18n.language
  );

  // Memoized with proper deps.
  const navItems = React.useMemo(() => {
    if (!isSub) return defaultNavItems;
    return defaultNavItems.filter(
      (it) => it.id === "home" || it.id === "myCampaigns" || it.id === "inbox"
    );
  }, [isSub, defaultNavItems]);

  React.useEffect(() => {
    if (isSub) {
      setBillingStatus(undefined);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const summary = await getMyBillingSummary();
        if (mounted) setBillingStatus(summary?.subscription?.status);
      } catch {
        if (mounted) setBillingStatus(undefined);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isSub, currentPath]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-200 text-black dark:bg-neutral-950 dark:text-white flex">
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

          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:justify-end border-b border-neutral-200 dark:border-neutral-800">
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

        <main className={`flex-1 min-h-0 overflow-y-auto px-4 pb-8 pt-4 lg:pt-6 ${SIDE_WIDTH ? "lg:pl-64" : "lg:pl-[72px]"}`}>
          {/* <BillingStatusBanner status={billingStatus} /> */}
          {children}
        </main>
      </div>
      <BillingLimitModal />
    </div>
  );
};

export default OnlineLayout;
