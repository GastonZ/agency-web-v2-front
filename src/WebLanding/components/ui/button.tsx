import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white text-[#0a0a0a] hover:bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] border border-white/20",
        destructive:
          "bg-[#1a0a0a] text-white/90 hover:bg-[#1f0f0f] border border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
        outline:
          "border border-white/[0.12] bg-[#0f0f0f] hover:bg-[#141414] hover:border-white/[0.18] text-white/80 hover:text-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
        secondary:
          "bg-[#141414] text-white/90 hover:bg-[#181818] border border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
        ghost: "hover:bg-[#0f0f0f] hover:text-white/90 text-white/70",
        link: "text-white/70 underline-offset-4 hover:underline hover:text-white/90",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-9 px-3 rounded-md",
        lg: "h-12 px-6 rounded-xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
