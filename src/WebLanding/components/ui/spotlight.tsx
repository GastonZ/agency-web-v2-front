
import React, { useRef, useEffect } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export const Spotlight = ({
  children,
  className = "",
  fill = "rgba(255, 255, 255, 0.05)",
}: {
  children: React.ReactNode
  className?: string
  fill?: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const { left, top } = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 transition duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${x}px ${y}px, ${fill}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  )
}

