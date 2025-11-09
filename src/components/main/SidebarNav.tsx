import * as React from "react";
import {
  Home,
  Settings,
  Folder,
  X,
  Factory
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "../features/ThemeToggle";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: IconType;
  children?: NavItem[];
};

type SidebarNavProps = {
  items: NavItem[];
  currentPath?: string;
  defaultCollapsed?: boolean;
  widthClassName?: string;
  className?: string;
  onClose?: () => void;
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  currentPath,
  defaultCollapsed = false,
  widthClassName = "w-64",
  className = "",
  onClose,
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const location = useLocation();
  const path = currentPath ?? location.pathname;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-30 p-3 md:p-4",
        isMobile
          ? "w-full"
          : collapsed
          ? "w-[120px]"
          : widthClassName,
        "transition-[width] duration-200 ease-out",
        className,
      ].join(" ")}
      aria-label="Primary"
      role="navigation"
    >
      <div
        className={[
          "h-[calc(100dvh-0.75rem)] md:h-[calc(100dvh-2rem)]",
          "rounded-2xl border shadow-sm",
          "bg-white/80 dark:bg-neutral-900/70",
          "backdrop-blur supports-[backdrop-filter]:bg-white/60",
          "border-neutral-200 dark:border-neutral-800",
          "flex flex-col overflow-hidden",
        ].join(" ")}
      >
        <div className="h-14 px-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold truncate text-neutral-900 dark:text-neutral-50">
              Welcome
            </span>
          </div>

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 overflow-x-hidden">
          <nav className="space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const isActive =
                !!it.href && (path === it.href || path.startsWith(`${it.href}/`));

              return (
                <Link
                  to={it.href || "#"}
                  key={it.id}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onClose}
                  className="group relative block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
                >
                  <div
                    className={[
                      "flex items-center gap-3 px-2 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800/80 dark:text-neutral-50"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70",
                    ].join(" ")}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    <span className="truncate">{it.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 px-2 flex flex-col items-center justify-center gap-2 py-3">
          {isMobile ? (
            <ThemeToggle />
          ) : collapsed ? (
            <span className="size-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          ) : (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              v1.0.3
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export const defaultNavItems: NavItem[] = [
  { id: "home", label: "Dashboard", href: "/", icon: Home },
  { id: "campaign", label: "Campaign", href: "/campaign_selection", icon: Folder },
  { id: "myCampaigns", label: "My Campaigns", href: "/my_campaigns", icon: Factory },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];
