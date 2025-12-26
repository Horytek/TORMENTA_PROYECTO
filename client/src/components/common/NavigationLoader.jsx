import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

const LoaderContext = createContext(null);

/**
 * LoaderProvider: mantiene el estado global del loader y garantiza una
 * visibilidad mínima cuando se inicia (minDuration en ms).
 */
export function LoaderProvider({ children, minDuration = 600 }) {
  const [isLoading, setIsLoading] = useState(false);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    // si ya está en proceso, no reiniciamos
    if (isLoading) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = Date.now();
    setIsLoading(true);
  }, [isLoading]);

  const stop = useCallback(() => {
    if (!isLoading) return;
    const elapsed = Date.now() - (startRef.current || 0);
    const remaining = Math.max(0, minDuration - elapsed);
    if (remaining <= 0) {
      setIsLoading(false);
      startRef.current = null;
    } else {
      // mantener visible hasta completar minDuration
      timerRef.current = setTimeout(() => {
        setIsLoading(false);
        startRef.current = null;
        timerRef.current = null;
      }, remaining);
    }
  }, [isLoading, minDuration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LoaderContext.Provider value={{ start, stop, isLoading }}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used within LoaderProvider");
  return ctx;
}

/**
 * LoaderOverlay: componente que muestra el overlay del loader cuando
 * el provider indica que isLoading === true.
 */
export function LoaderOverlay() {
  const { isLoading } = useLoader();
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-500">
      <div className="relative flex items-center justify-center">
        {/* Logo Central (Static or subtle breathe) */}
        <div className="relative z-10 p-2 bg-white dark:bg-zinc-950 rounded-full">
          <img
            src="/horycore.png"
            alt="Cargando..."
            className="w-8 h-8 object-contain opacity-90"
          />
        </div>

        {/* Anillo Giratorio Delgado */}
        <div className="absolute inset-0 -m-1 border-2 border-slate-100 dark:border-zinc-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full w-full h-full animate-spin"></div>
      </div>
    </div>
  );
}

/**
 * SuspenseFallbackTrigger: pequeño componente que notifica al provider
 * cuando el Suspense está mostrando el fallback (mount/unmount).
 * No renderiza UI concreta porque la UI del loader la provee LoaderOverlay.
 */
export function SuspenseFallbackTrigger() {
  const { start, stop } = useLoader();
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);
  return null;
}

export default LoaderProvider;
