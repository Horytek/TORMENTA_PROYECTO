import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@heroui/use-theme";
import { Sun, Moon } from "lucide-react";

export default function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(checkDark);
  }, [theme]);

  if (!mounted) return <div className="w-20 h-9 bg-slate-200 rounded-full" />;

  const toggleSwitch = () => {
    const newStatus = !isDark;
    setIsDark(newStatus); // Optimistic update
    // Small delay to allow animation to start before heavy theme switch
    setTimeout(() => {
      setTheme(newStatus ? 'dark' : 'light');
    }, 50);
  };

  return (
    <div className="flex items-center gap-2"> {/* Reduced gap from 3 to 2 */}
      <div
        className={`relative flex h-9 w-16 cursor-pointer items-center rounded-full p-1 shadow-inner transition-colors duration-500 overflow-hidden ${isDark ? "bg-slate-900" : "bg-sky-400"
          }`}
        onClick={toggleSwitch}
      >
        {/* The Handler (Sun / Moon) */}
        <motion.div
          className={`relative h-7 w-7 rounded-full shadow-md z-10 flex items-center justify-center bg-white`}
          layout
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 40
          }}
          style={{
            marginLeft: isDark ? "auto" : "0",
          }}
        >
          <motion.div
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? (
              <Moon size={14} className="text-slate-800" fill="currentColor" />
            ) : (
              <Sun size={14} className="text-amber-500" fill="currentColor" />
            )}
          </motion.div>
        </motion.div>

        {/* Background Elements (Clouds/Stars) */}
        <AnimatePresence>
          {isDark ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-2 top-3 h-0.5 w-0.5 rounded-full bg-white opacity-60" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-4 bottom-2 h-1 w-1 rounded-full bg-white opacity-40" />
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-2 top-2 h-1 w-3 rounded-full bg-white/30" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-4 bottom-2 h-1 w-4 rounded-full bg-white/30" />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Label Text */}
      <div className="min-w-[40px] flex justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={isDark ? "Noche" : "Día"}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 pointer-events-none"
          >
            {isDark ? "Noche" : "Día"}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}