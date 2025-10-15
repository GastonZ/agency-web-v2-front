import { motion } from "framer-motion"
import type { ReactNode } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
  duration?: number
}

export function AnimatedSection({ 
  children, 
  delay = 0, 
  className = "",
  direction = "up",
  duration = 0.6
}: AnimatedSectionProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 20 }
      case "down":
        return { opacity: 0, y: -20 }
      case "left":
        return { opacity: 0, x: 20 }
      case "right":
        return { opacity: 0, x: -20 }
      default:
        return { opacity: 0, y: 20 }
    }
  }

  const getAnimatePosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 1, y: 0 }
      case "down":
        return { opacity: 1, y: 0 }
      case "left":
        return { opacity: 1, x: 0 }
      case "right":
        return { opacity: 1, x: 0 }
      default:
        return { opacity: 1, y: 0 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={{ 
        duration, 
        delay, 
        ease: "easeOut" 
      }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Componente específico para animaciones de escala
export function AnimatedScale({ 
  children, 
  delay = 0,
  className = "",
  scale = [1, 1.1, 1],
  duration = 2,
  repeatDelay = 3
}: {
  children: ReactNode
  delay?: number
  className?: string
  scale?: number[]
  duration?: number
  repeatDelay?: number
}) {
  return (
    <motion.div
      animate={{ scale }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        repeatDelay,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
