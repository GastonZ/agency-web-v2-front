import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuración del canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    // Inicializar partículas SOLO alrededor del rayo de luz
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = 60; // Optimizado para rendimiento

      // Área del rayo de luz (diagonal desde top-left)
      const lightStartX = 0;
      const lightStartY = 0;
      const lightEndX = canvas.width;
      const lightEndY = canvas.height;

      for (let i = 0; i < particleCount; i++) {
        // Generar partículas en el área del rayo de luz
        const t = Math.random(); // Posición a lo largo del rayo
        const baseX = lightStartX + (lightEndX - lightStartX) * t;
        const baseY = lightStartY + (lightEndY - lightStartY) * t;

        // Añadir variación perpendicular al rayo - concentrado en los bordes
        const edgeBias = Math.random() < 0.7 ? 1 : -1; // 70% de probabilidad de estar en los bordes
        const perpendicularOffset = (Math.random() * 0.8 + 0.2) * 120 * edgeBias; // Concentrado en los bordes
        const angle = Math.atan2(lightEndY - lightStartY, lightEndX - lightStartX) + Math.PI / 2;

        particlesRef.current.push({
          x: baseX + Math.cos(angle) * perpendicularOffset,
          y: baseY + Math.sin(angle) * perpendicularOffset,
          vx: (Math.random() - 0.5) * 0.2, // Movimiento muy lento
          vy: (Math.random() - 0.5) * 0.2,
          size: 0.6, // Tamaño pequeño como antes
          opacity: 0.4, // Opacidad sutil pero visible
          life: Math.random() * 100,
          maxLife: 100
        });
      }
    };

    // Función de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Actualizar posición
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 0.5;

        // Rebotar en los bordes suavemente
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
        }

        // Renovar partículas que se salen del área del rayo
        if (particle.life > particle.maxLife) {
          const t = Math.random();
          const baseX = 0 + (canvas.width - 0) * t;
          const baseY = 0 + (canvas.height - 0) * t;
          const edgeBias = Math.random() < 0.7 ? 1 : -1; // 70% de probabilidad de estar en los bordes
          const perpendicularOffset = (Math.random() * 0.8 + 0.2) * 120 * edgeBias; // Concentrado en los bordes
          const angle = Math.atan2(canvas.height - 0, canvas.width - 0) + Math.PI / 2;

          particle.x = baseX + Math.cos(angle) * perpendicularOffset;
          particle.y = baseY + Math.sin(angle) * perpendicularOffset;
          particle.life = 0;
        }

        // Dibujar partícula con gradiente sutil
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, `rgba(16, 185, 129, ${particle.opacity})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Inicializar
    resizeCanvas();
    initParticles();
    animate();

    // Event listeners
    const handleResize = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
      style={{ zIndex: 1 }}
    />
  );
};

export default FloatingParticles;
