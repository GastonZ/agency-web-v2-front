import * as React from "react";
import { motion } from "framer-motion";
import OnlineLayout from "../../../layout/OnlineLayout";

const STATUS = [
  "Cargando memoria y entorno…",
  "Levantando herramientas de moderación…",
  "Sincronizando contexto con Alma…",
  "Inicializando sesión de voz…",
  "Preparando paneles y validaciones…",
];

function CodeBelt({
  y = "50%",
  rotate = 0,
  speed = 12,
  opacity = 0.25,
}: {
  y?: string;
  rotate?: number;
  speed?: number;
  opacity?: number;
}) {

  const TEXT =
    "01 10 11 00 1010 0110 1101 0011  // IA: preparando contexto  ";
  const line = Array.from({ length: 22 })
    .map(() => TEXT)
    .join("");

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 w-full select-none"
      style={{
        top: y,
        transform: `rotate(${rotate}deg)`,

        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <motion.div
        className="whitespace-nowrap font-mono text-[11px] tracking-widest"
        style={{
          opacity,
          color: "rgba(16,185,129,0.55)", // emerald-500/55
          textShadow: "0 0 8px rgba(16,185,129,0.25)",
        }}
        initial={{ x: "-60%" }}
        animate={{ x: "120%" }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {line}
      </motion.div>
    </div>
  );
}

function GlyphSweep() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <CodeBelt y="28%" rotate={-6} speed={10} opacity={0.28} />
      <CodeBelt y="50%" rotate={-2} speed={13} opacity={0.35} />
      <CodeBelt y="72%" rotate={-8} speed={16} opacity={0.22} />
    </div>
  );
}

function NeuralNet() {
  const nodes = [
    { id: "n1", x: 40, y: 120 },
    { id: "n2", x: 140, y: 60 },
    { id: "n3", x: 140, y: 180 },
    { id: "n4", x: 280, y: 40 },
    { id: "n5", x: 280, y: 200 },
    { id: "n6", x: 420, y: 120 },
  ];

  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 5],
    [1, 2],
    [3, 4],
  ];

  return (
    <svg viewBox="0 0 520 240" className="w-full h-[240px]">
      <defs>
        <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(16,185,129,0.1)" />
          <stop offset="50%" stopColor="rgba(16,185,129,0.6)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.1)" />
        </linearGradient>
        <radialGradient id="nodeGrad">
          <stop offset="0%" stopColor="rgba(16,185,129,1)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.2)" />
        </radialGradient>
      </defs>

      {edges.map(([a, b], i) => {
        const A = nodes[a], B = nodes[b];
        return (
          <motion.line
            key={`e-${i}`}
            x1={A.x}
            y1={A.y}
            x2={B.x}
            y2={B.y}
            stroke="url(#lineGrad)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.4 + (i % 3) * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}

      {/* Nodos “neurona” */}
      {nodes.map((n, i) => (
        <g key={n.id}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={10}
            fill="url(#nodeGrad)"
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 1.8 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={18}
            fill="none"
            stroke="rgba(16,185,129,0.35)"
            strokeWidth={1}
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 2.2 + (i % 3) * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      ))}
    </svg>
  );
}

export default function ModerationSkeleton() {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setIdx((v) => (v + 1) % STATUS.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <OnlineLayout>
      <div className="relative w-full h-screen grid place-items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-100/30 via-white/50 to-emerald-50/20 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/30" />
        <motion.div
          className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.25), transparent 70%)" }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 -right-24 w-[460px] h-[460px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.22), transparent 70%)" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        />

        <GlyphSweep />

        <div className="relative w-[min(900px,92vw)] rounded-2xl border border-emerald-300/30 dark:border-emerald-500/20 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(16,185,129,0.25)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-300">
              LISA está preparando tu campaña
            </div>
          </div>

          <NeuralNet />

          <div
            className="mt-4 h-6 grid place-items-center"
            aria-live="polite"
            aria-atomic="true"
          >
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="px-3 py-1 rounded-full text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
            >
              {STATUS[idx]}
            </motion.div>
          </div>
        </div>
      </div>
    </OnlineLayout>
  );
}
