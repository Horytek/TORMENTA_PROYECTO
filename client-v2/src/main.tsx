import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Habilita el shell del POS offline (ver public/sw.js). Falla en silencio en
// navegadores/entornos sin soporte (ej. vista previa embebida) — no es crítico.
//
// Solo en producción: en desarrollo Vite sirve los módulos con URL sin hash
// (`/src/...`), y la estrategia cache-first del worker los congelaría para
// siempre — cada cambio de código quedaría invisible y el HMR dejaría de
// funcionar, con un síntoma dificilísimo de atribuir al service worker.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const registrar = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); };
  // Si `load` ya ocurrió (recarga rápida, restauración desde bfcache, script
  // que entra tarde), el listener no dispararía nunca y el POS se quedaría sin
  // shell offline sin ningún síntoma. Se cubre el caso explícitamente.
  if (document.readyState === 'complete') registrar();
  else window.addEventListener('load', registrar, { once: true });
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Si alguien ya lo instaló corriendo un build en local, se desregistra para
  // que el entorno de desarrollo no quede servido desde la caché vieja.
  // Desregistrar NO borra las cachés, así que se limpian también: si no,
  // quedan ocupando espacio y reaparecen sirviendo assets viejos en cuanto
  // alguien vuelva a probar un build local.
  navigator.serviceWorker.getRegistrations()
    .then((rs) => Promise.all(rs.map((r) => r.unregister())))
    .then(() => caches?.keys())
    .then((claves) => Promise.all((claves ?? []).map((k) => caches.delete(k))))
    .catch(() => {});
}
