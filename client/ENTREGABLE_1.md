# ENTREGABLE 1: Inspección Técnica & Plan

## 1. Stack Tecnológico Detectado
- **Framework:** **Vite + React** (No es Next.js).
  - *Nota:* Actuaré con patrones de React SPA (`react-router-dom`) en lugar de App Router.
- **Estilos:** **Tailwind CSS v4** + `framer-motion`.
  - Configuración híbrida: `main.css` (CSS-first) + `tailwind.config.js` (Legacy/JS tokens).
  - Tema Landing: Variables CSS en `src/components/landing/styles/landing-theme.css`.
- **Ecosistema 3D:** `@react-three/fiber` + `@react-three/drei` + `maath`.
- **UI:** Custom components + `lucide-react`.

## 2. Mapa de Componentes (Landing)
| Sección | Archivo Principal | Componentes Hijos |
| :--- | :--- | :--- |
| **Hero** | `src/components/landing/Hero.jsx` | `LivingDashboard.jsx` (Mockup), `FloatingCard.jsx`, `ParticleBackground.jsx` (Canvas) |
| **Blueprint**| `src/components/landing/blueprint/BlueprintSection.jsx` | `LivePermissions.jsx` (Interactive Matrix) |
| **Caso Éxito**| `src/components/landing/CaseStudy.jsx` | N/A |
| **Pricing** | `src/components/landing/Pricing.jsx` | N/A |
| **Footer** | `src/components/landing/Footer.jsx` | N/A |
| **3D Bg** | `src/components/landing/3d/ParticleBackground.jsx` | `Canvas` (R3F), `Points` |

## 3. Plan de Modificación (PASO 1)

### A) Hero (`Hero.jsx` + `LivingDashboard.jsx`)
- **Jerarquía:** Ajustar clases de texto (`text-5xl` -> `text-4xl`, tracking).
- **Interacción:** Vincular estado `activeSector` con el highlight del texto "impulsa".
- **Microcopy:** Insertar bloque de confianza bajo CTAs.
- **CTAs:** Refinar estilos (Solid Primary vs Outline Secondary).

### B) Background (`ParticleBackground.jsx`)
- **Visual:** Reducir velocidad de rotación (`delta / 10` -> `delta / 50`).
- **Densidad:** Reducir `count` de 5000 a 2000 (Desktop) para look "clean data".
- **Mobile:** Renderizado condicional basado en `window.innerWidth` o CSS media query para ocultar Canvas.

### C) Cards (`FloatingCard.jsx`)
- **Glass:** Estandarizar clases: `bg-white/5 border-white/10 backdrop-blur-md`.
- **Posición:** Ajustar coordenadas en `Hero.jsx` para evitar cortes en viewport.

### D) Blueprint (`LivePermissions.jsx`)
- **Log:** Implementar `setInterval` para añadir líneas al log cada 2s cuando hay interacción.
- **Feedback:** Acentuar opacidad en celdas de matriz activas.

### E) Caso de Éxito (`CaseStudy.jsx`)
- **Métricas:** Reemplazar placeholders con datos estructurados (-40%, +22%).
- **UI:** Añadir cards para las métricas en lugar de texto plano.

### F) Pricing (`Pricing.jsx`)
- **Enterprise:** Cambiar botón a "Contactar Ventas".
- **FAQ:** Añadir sección "Dudas rápidas" al final del componente.

---
*Procederé a ejecutar estos cambios fase por fase.*
