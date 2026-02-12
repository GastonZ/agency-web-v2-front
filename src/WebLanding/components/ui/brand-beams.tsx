
import React from "react"
import { motion } from "framer-motion"

export const BrandBeams = ({ className = "" }: { className?: string }) => {
  // Patrón de grid system - 8 columnas distribuidas uniformemente
  // Similar al patrón del footer: líneas que se extienden por todo el ancho
  const numColumns = 8
  
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}>
      {/* Container que ocupa todo el ancho - grid completo */}
      <div className="absolute inset-0 w-full h-full">
        {/* Líneas verticales distribuidas uniformemente - grid system */}
        {[...Array(numColumns)].map((_, i) => {
          // Cada columna ocupa 1/8 del ancho total
          const leftPercent = (i * (100 / numColumns))
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="absolute bg-white/[0.03] border-l border-r border-white/[0.12]"
              style={{
                width: '1px',
                left: `${leftPercent}%`,
                top: 0,
                bottom: 0,
                height: '100%',
              }}
            />
          )
        })}
      </div>

      {/* Versión responsive para pantallas más pequeñas */}
      <div className="absolute inset-0 w-full h-full md:hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/[0.03] border-l border-r border-white/[0.12]"
            style={{
              width: '1px',
              left: `${(i + 1) * (100 / 7)}%`,
              top: 0,
              bottom: 0,
              height: '100%',
            }}
          />
        ))}
      </div>

      {/* Light rays effect - diagonales sutiles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 light-ray"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0 light-ray-2"
      />
    </div>
  )
}

