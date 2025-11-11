import * as React from "react";
import { motion } from "framer-motion";
import OnlineLayout from "../../../layout/OnlineLayout";

const STATUS = ["Loading.", "Loading..", "Loading..."];

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
  const TEXT = "01 10 11 00 1010 0110 1101 0011  // IA: preparing context  ";
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

/** Loader circular simple y lindo */
function RingLoader() {
  return (
    <div className="relative w-20 h-20">
      {/* halo suave */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)" }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* anillo base */}
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          className="stroke-emerald-500/15"
          strokeWidth="10"
        />
        {/* arco animado */}
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          strokeWidth="10"
          className="stroke-emerald-500"
          strokeLinecap="round"
          strokeDasharray="238"
          strokeDashoffset="180"
          animate={{ strokeDashoffset: [180, 60, 180], rotate: [0, 360] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 50%" }}
        />
      </svg>

    </div>
  );
}

export default function ModerationSkeleton() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIdx((v) => (v + 1) % STATUS.length), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <OnlineLayout>
      <div className="relative w-full h-screen grid place-items-center overflow-hidden">
        {/* fondo suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-100/30 via-white/50 to-emerald-50/20 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/30" />
        {/* blobs */}
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

        {/* barrido de “código” tenue (opcional) */}
        <GlyphSweep />

        {/* tarjeta central */}
        <div className="relative w-[min(900px,92vw)] rounded-2xl border border-emerald-300/30 dark:border-emerald-500/20 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(16,185,129,0.25)] p-8 flex flex-col items-center gap-5">
          <RingLoader />

          {/* etiqueta de estado */}
          <div className="h-7 grid place-items-center" aria-live="polite" aria-atomic="true">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
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
