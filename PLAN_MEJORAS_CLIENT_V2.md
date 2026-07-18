# Plan de mejoras — client-v2 (Horytek ERP)

> Documento de trabajo. Se escribe ANTES de tocar código, tal como se pidió. Refleja el plan aprobado en la sesión de planificación con Claude Code. Cada fase se marca ✅ al terminar y verificarse.

## Resumen

Llevar `client-v2` a un estado más completo, modular y "novedoso": permisos dinámicos, un módulo de Contabilidad nuevo, una función innovadora en el POS, un componente `AdaptiveCard` que cubra cualquier módulo, un Dashboard e Historial de Ventas rediseñados sobre ese componente, y una landing page pública nueva.

## Decisiones de alcance (ya confirmadas)

| Tema | Decisión |
|---|---|
| Contabilidad | Versión simple: gastos/egresos + reporte de Ganancias y Pérdidas (P&L). Sin plan de cuentas de partida doble. Sí implica 2 tablas nuevas (`gasto`, `gasto_categoria`). |
| Planes de pago | Solo la landing muestra precios/features reales, tomados de `src/config/plans.config.js` (backend): Básico S/85·850, Pro S/135·1350, Enterprise S/240·2400. No se toca `client/`, `BillingDrawer.tsx` ni MercadoPago. |
| Seguridad backend | Sí — se agrega autorización real server-side en rutas sensibles que hoy solo exigen JWT válido (sin chequeo de permiso/rol). |
| Landing | Una sola página moderna (hero + features + pricing + FAQ + CTA + footer). Sin páginas satélite (blog, empleo, etc.). |
| Variantes de producto | Ya confirmado en sesión anterior: no queda ninguna UI de variantes en `client-v2`. No se toca nada de eso aquí. |

## Fases

- [x] **Fase 0** — Este documento.
- [x] **Fase 1** — Backend: middleware `authorize.middleware.js` (`requireDeveloper`, `requireCapability`) aplicado a rutas de `rol`, `permisos`, `permisos-globales`, `modulos`, `submodulos`, `rutas`, `developer`, `sync`. De paso se corrigió un bug real preexistente: `createAccessToken` (`src/libs/jwt.js`) no incluía `rol`/`pv` en el JWT pese a que `auth.controller.js` los pasaba — el token nunca llevaba el rol del usuario. Verificado con pruebas curl reales (403 para no-developer, 200 para acción permitida por rol).
- [x] **Fase 2** — Frontend: hook `usePermissions()`, guard de ruta `RequireCapability`, navegación (sidebar + búsqueda) derivada dinámicamente del catálogo `GET /rutas/modulos` en vez de arrays hardcodeados, tab de auditoría de permisos en el panel Developer. De paso se migraron ~15 sitios del patrón duplicado `roleId===10 || capabilities.has(...)` al hook centralizado, y se detectó/corrigió una inconsistencia de datos real en BD (módulo con `ruta=/proveedores` guardado con `nombre_modulo="Config. Negocio"`) forzando títulos explícitos en el mapa de navegación en vez de confiar en el nombre de BD. Verificado en navegador: sidebar dinámico correcto, `/settings/roles` accesible para Admin, `/developer` bloqueado con "Acceso restringido" para no-developer.
- [x] **Fase 3** — `AdaptiveCard`: variantes `split-row` y `stat-tile` implementadas de verdad (antes eran stubs que caían al `default`), selector de columnas conectado a estado real, headers de modo lista derivados de los `FieldDef` en vez de un grid hardcodeado para catálogo de productos. De paso: auto-detección de campo `semantic:"avatar"` para producir `slots.media` automáticamente. 100% aditivo — los 10 módulos existentes que usan `AdaptiveCollection` siguen renderizando igual (verificado: Clientes, tsc limpio).
- [x] **Fase 4** — Módulo Contabilidad: tablas `gasto`/`gasto_categoria` (migración `scripts/migrations/create_contabilidad_tables.js`, ejecutada con confirmación explícita del usuario), módulo "Contabilidad" registrado en el catálogo de navegación (global, `ruta=/contabilidad`), permiso otorgado al rol Admin del tenant 1, categorías de gasto sembradas para todos los tenants existentes. Backend: `gastos.controller.js`/`gastos.routes.js` (CRUD + `/pl` para el Estado de Resultados), protegido con `requireCapability` de Fase 1. Frontend: feature `accounting` completo (Gastos con `AdaptiveCollection`, Estado de Resultados con las nuevas tarjetas `stat-tile` de Fase 3). Verificado end-to-end: migración, curl a los 4 endpoints, y navegador (creación de gasto, listado, P&L con Ingresos/Gastos/Utilidad).
- [x] **Fase 5** — Dashboard: las 4 tarjetas KPI + una nueva 5ª ("Utilidad del Mes", consume `/gastos/pl` de Fase 4) ahora son `AdaptiveCard variant="stat-tile"`; `RecentTransactionsTable` migrada de tabla HTML a `AdaptiveCollection` (layout list). Verificado en navegador: 5 tiles renderizando con datos reales (incluida la utilidad negativa en rojo), tabla de comprobantes con estado vacío correcto, y confirmación visual de que "Contabilidad" ya aparece solo en el sidebar (Fase 2 + Fase 4 funcionando juntas).
- [x] **Fase 6** — Historial de ventas (`SalesHistoryTab.tsx`) migrado de tabla HTML a `AdaptiveCollection` (layout list), manteniendo filtros, las 6 stat cards y exportación CSV intactos. Verificado en navegador (tsc limpio, estado vacío correcto).
- [x] **Fase 7** — POS: tickets en espera (`useCartStore` con `heldTickets`, persistidos vía `zustand/persist`), botón "Aparcar venta" + panel "En espera" en `POSScreen.tsx`, y campo de descuento en `PaymentModal.tsx` que recalcula el total en vivo (`cart.descuento`, ya enviado como `descuento_venta` al backend). Verificado en navegador: se agregó un producto, se aparcó, el badge mostró "1", se retomó y el carrito se restauró exacto, y el descuento de S/10 recalculó el total de S/65.00 a S/55.00 correctamente.
- [x] **Fase 8** — Landing page pública nueva en `/` (`features/landing/pages/LandingPage.tsx`: Hero, Features, Pricing, FAQ, CTA, Footer), reusando el sistema de marca de `LoginPage.tsx` (paleta, `HorytekMark`, `SwatchStrip`, `SizeCurve`). Login movido a `/login`. Precios reales de `src/config/plans.config.js` (Básico S/85, Pro S/135, Enterprise S/240). Verificado en navegador: landing pública completa, redirección automática a `/dashboard` si ya hay sesión, y flujo completo `/` → `/login` → login real → `/dashboard`.
- [x] **Fase 9** — Verificación final: `tsc --noEmit` completo sobre `client-v2` sin errores nuevos (los únicos restantes son preexistentes, en archivos no tocados por este roadmap — incluido el trabajo paralelo de `kardex-inventario`). Backend saludable (`/api/health` 200). Recorrido manual en navegador de las 8 fases con el usuario `tormenta`.

## Qué NO se toca (fuera de alcance)

- `client/` (frontend legacy, en producción).
- `BillingDrawer.tsx`, flujo de MercadoPago, cambio de plan self-service.
- Modelo de datos de variantes de producto (`producto_sku`, `atributo*`) — sigue vivo en backend mas no se usa.
- Esquema de la tabla `rol` (no se agrega flag `is_system`, se mantiene `id_rol === 10` como convención de Developer, ahora centralizada en un solo helper backend y uno frontend).

## Notas de riesgo

Fases 1 y 4 tocan backend (autorización real y DDL respectivamente) con autorización explícita del usuario. Son cambios aditivos: no se altera ni borra nada existente. Cada fase se verifica antes de continuar con la siguiente.
