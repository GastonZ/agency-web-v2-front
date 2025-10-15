// Configuración de breakpoints responsive para Datacivis
export const breakpoints = {
  xs: '475px',   // Extra small devices
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
} as const

// Clases de padding responsive
export const paddingClasses = {
  section: 'px-3 sm:px-4 md:px-6 lg:px-8',
  container: 'px-4 sm:px-6 md:px-8 lg:px-10',
  card: 'p-4 sm:p-6 md:p-8',
  button: 'px-4 sm:px-6 md:px-8 py-2.5 sm:py-3',
  badge: 'px-3 sm:px-4 md:px-6 py-1.5 sm:py-2'
} as const

// Clases de texto responsive
export const textClasses = {
  heading: {
    h1: 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    h4: 'text-base sm:text-lg md:text-xl'
  },
  body: {
    large: 'text-sm sm:text-base md:text-lg',
    medium: 'text-xs sm:text-sm md:text-base',
    small: 'text-xs sm:text-sm'
  }
} as const

// Clases de spacing responsive
export const spacingClasses = {
  section: 'py-8 sm:py-12 md:py-16 lg:py-20',
  container: 'gap-4 sm:gap-6 md:gap-8',
  grid: 'gap-2 sm:gap-3 md:gap-4 lg:gap-6'
} as const

// Clases de grid responsive
export const gridClasses = {
  features: 'grid grid-cols-1 md:grid-cols-2',
  useCases: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  testimonials: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  benefits: 'flex flex-col lg:flex-row'
} as const

// Utilidades para responsive
export const responsive = {
  // Ocultar en ciertos breakpoints
  hide: {
    mobile: 'hidden sm:block',
    tablet: 'hidden md:block lg:hidden',
    desktop: 'hidden lg:block',
    mobileOnly: 'block sm:hidden'
  },
  // Mostrar solo en ciertos breakpoints
  show: {
    mobile: 'block sm:hidden',
    tablet: 'hidden sm:block lg:hidden',
    desktop: 'hidden lg:block'
  }
} as const
