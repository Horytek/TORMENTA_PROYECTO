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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40">
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-12 w-12 text-secondary-color" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
        <div className="w-11/12 md:w-3/4 lg:w-2/3">
          <div className="h-6 bg-bgDark3/60 rounded-full mb-3 animate-pulse"></div>
          <div className="h-4 bg-bgDark3/50 rounded-full mb-2 animate-pulse w-3/4"></div>
          <div className="h-4 bg-bgDark3/50 rounded-full animate-pulse w-1/2"></div>
        </div>
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
