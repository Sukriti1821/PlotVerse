import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Logo from "./common/Logo";

function SplashScreen({ onFinish }) {
  const finishCalledRef = useRef(false);

  useEffect(() => {
    // Hold brand display gracefully for 1.3s then transition seamlessly to page
    const timer = window.setTimeout(() => {
      if (!finishCalledRef.current) {
        finishCalledRef.current = true;
        onFinish?.();
      }
    }, 1300);

    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      role="status"
      aria-label="Loading Thikana"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: "blur(12px)",
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white select-none overflow-hidden"
    >
      {/* Subtle emerald ambient backdrop glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      {/* Center brand block */}
      <div className="relative flex flex-col items-center px-6 text-center max-w-sm">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: "easeInOut",
            }}
            className="absolute -inset-2 rounded-3xl bg-emerald-500/20 blur-xl"
          />
          <motion.div
            initial={{ y: 18, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl bg-slate-900/80 p-3.5 shadow-[0_20px_50px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/40 overflow-hidden backdrop-blur-xl"
          >
            <Logo variant="icon" className="h-20 w-20 relative z-10" />
          </motion.div>
        </div>

        {/* Brand Name Headline */}
        <motion.h1
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(16,185,129,0.2)]"
        >
          <span className="text-white">Plot</span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
            Verse
          </span>
        </motion.h1>

        {/* Brand Tagline */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-xs sm:text-sm font-semibold tracking-wide text-emerald-400 font-sans"
        >
          Mera Thikana - your own patch of the mountains, by the hour
        </motion.p>
      </div>
    </motion.div>
  );
}

export default SplashScreen;
