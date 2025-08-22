import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/helper";

/**
 * Minimal, dependency-free tooltip set with a shadcn-like API:
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>...</TooltipTrigger>
 *     <TooltipContent side="top">Hello</TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 */

type Side = "top" | "bottom" | "left" | "right";

type TooltipContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  side: Side;
  setSide: (s: Side) => void;
  id: string;
};

const TooltipCtx = React.createContext<TooltipContextValue | null>(null);

export function TooltipProvider({
  children,
  delayDuration = 80,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  // provider is a no-op here but kept for API parity & future global configs
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [side, setSide] = React.useState<Side>("top");
  const triggerRef = React.useRef<HTMLElement>(null);
  const id = React.useId();

  const value: TooltipContextValue = {
    open,
    setOpen,
    triggerRef,
    side,
    setSide,
    id,
  };

  return <TooltipCtx.Provider value={value}>{children}</TooltipCtx.Provider>;
}

export function TooltipTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(TooltipCtx);
  if (!ctx) throw new Error("TooltipTrigger must be used inside <Tooltip>");

  const { setOpen, triggerRef, id } = ctx;

  const props = {
    ref: triggerRef as any,
    "aria-describedby": id,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild) {
    return React.cloneElement(children, props);
  }

  return React.cloneElement(children, {
    ...children.props,
    ...props,
    className: cn(children.props.className),
  });
}

export function TooltipContent({
  children,
  side = "top",
  className,
}: {
  children: React.ReactNode;
  side?: Side;
  className?: string;
}) {
  const ctx = React.useContext(TooltipCtx);
  if (!ctx) throw new Error("TooltipContent must be used inside <Tooltip>");
  const { open, triggerRef, id, setSide } = ctx;

  React.useEffect(() => setSide(side), [side, setSide]);

  const [coords, setCoords] = React.useState<{ top: number; left: number }>({
    top: -9999,
    left: -9999,
  });

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    let top = 0;
    let left = 0;

    switch (side) {
      case "top":
        top = rect.top + window.scrollY - gap;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case "left":
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - gap;
        break;
      case "right":
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX + gap;
        break;
    }

    setCoords({ top, left });
  }, [open, triggerRef, side, children]);

  if (!open) return null;

  return createPortal(
    <div
      id={id}
      role="tooltip"
      className={cn(
        "pointer-events-none select-none",
        "fixed z-50",
        className
      )}
      style={{
        top:
          side === "top" || side === "bottom"
            ? coords.top + (side === "top" ? -4 : 4)
            : coords.top,
        left:
          side === "left" || side === "right"
            ? coords.left + (side === "left" ? -4 : 4)
            : coords.left,
        transform:
          side === "top" || side === "bottom"
            ? "translateX(-50%)"
            : "translateY(-50%)",
      }}
    >
      <div
        className={cn(
          // glassy, subtle neon
          "rounded-md px-2.5 py-1.5 text-xs",
          "bg-white/20 dark:bg-neutral-900/30 backdrop-blur-xl",
          "border border-white/30 dark:border-white/10",
          "text-neutral-800 dark:text-neutral-200",
          "shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_8px_30px_rgba(16,185,129,0.2)]"
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
