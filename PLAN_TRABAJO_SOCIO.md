# Plan de trabajo — reparto con el socio técnico

> Actualizado: 2026-08-03 · Rama: `feature/frontend-v2`
> Roadmap completo de producto: `PLAN_MAESTRO_CLAUDE_CODE.md`.
> **Este documento no repite el roadmap.** Sirve para dos cosas concretas: qué
> falta de verdad —medido contra la base, no declarado— y quién agarra qué.
>
> Si algo acá contradice al código, **el código gana**: avisa de la discrepancia.

---

## 1. Estado medido hoy

Números sacados de la base local, no del plan:

| Métrica | Valor | Qué significa |
|---|---|---|
| `attrs_key` canónica / legada | **350 / 1306** | `resolveSku` solo entiende la canónica |
| Filas huérfanas en `inventario_stock` | **17** (25 uds) | Ningún reporte puede atribuirlas a un producto |
| SKU con costo | **0 de 1687** | La pantalla de Margen no tiene nada que mostrar |
| Stock del tenant 1 | 35 368 | Foto de referencia: ningún cambio debe alterarla |
| Módulos con permiso pero sin plan | **9 de 21** | 403 el día que se active `AUTHZ_UNIFIED` |
| `exchangeProducto` → movimientos de stock | **0 referencias** | El cambio de talla no mueve inventario |

**Lectura corta:** el sistema ya vende, calcula margen y factura. Lo que falta
no son módulos nuevos — es que lo construido sea confiable con datos reales.

---

## 2. Lo que falta, por orden de daño

### 🔴 A. Cambio de talla (no funciona)

Es *la* operación posventa de una tienda de ropa. `exchangeProducto`
(`src/controllers/ventas.controller.js`) cambia el producto en `detalle_venta`
pero **no toca stock**: no devuelve la prenda vieja ni descuenta la nueva. Y
solo recibe `id_producto_nuevo`, sin talla ni color, así que cambiar una M por
una L del mismo polo es inexpresable.

*Terminado cuando:* recibe SKU origen y destino, mueve stock en ambos sentidos
dentro de una transacción y deja bitácora. `devoluciones.controller.js` ya lo
hace bien y sirve de plantilla.

### 🔴 B. Saneamiento del catálogo de SKU

1306 de 1687 variantes en formato legado, 31 grupos duplicados, 17 huérfanas.
Mientras siga así, el POS con variantes y las anulaciones históricas son
frágiles: `resolveSku` no encuentra la variante y **crea una nueva**, dispersando
el stock.

Es el **único trabajo con fases irreversibles** — pide ventana y respaldo. En
orden: normalizar `attrs_key` desde `sku_atributo_valor` → fusionar duplicados
con `estado = 0` (nunca borrar) → resolver las 17 huérfanas → endurecer
`resolveSku`, que hoy no filtra por tenant y compara nombres sin normalizar
tildes.

### 🟠 C. Costos reales cargados

El modelo funciona de punta a punta, pero **0 de 1687 SKU tienen costo**, así
que Margen sale vacío. No es código: hay que sentarse con los números del
negocio y cargarlos en `/products/costos`. La lista viene ordenada por unidades
en juego, así que los primeros 20 productos cubren la mayor parte del inventario.

### 🟠 D. Los 9 módulos fuera de plan

`/compras`, `/contabilidad`, `/devoluciones`, `/gestor-contenidos`,
`/guia_remision`, `/inventario`, `/libro_ventas`, `/logs` y `/nota_almacen`
tienen permiso de administrador pero no figuran en ningún
`plan_entitlement_modulo`.

Hoy no molesta porque el middleware corre en modo *shadow* (decide el SQL
legado y el resolver nuevo solo compara). El día que se active `AUTHZ_UNIFIED`,
los nueve responden `PLAN_NOT_INCLUDED` a todo el mundo.

**Es decisión de negocio, no técnica:** hay que definir qué plan incluye qué.
Es la lista de precios del producto.

### 🟠 E. Importador que sirva para migrar

`ImportProductsDialog.tsx` ya resuelve marca y subcategoría por nombre — eso
estaba bien resuelto. Pero exige una plantilla fija de 6 columnas y crea
productos **pelados**: sin variantes, sin stock y sin costo. Después de
importar, el cliente no puede vender ni ver margen.

Falta: mapeo flexible de columnas, detección de curva de tallas, vista previa
que no escriba nada, y que la confirmación cree producto + SKU + stock + costo
en una sola transacción.

### 🟡 F. `ALLOW_REMOTE_MIGRATE` en migraciones destructivas

La guardia de host local tiene una puerta trasera por variable de entorno en 20
migraciones, tres de ellas destructivas (`limpiar_tablas_muertas`,
`drop_indices_redundantes`, `unicos_por_tenant`). Una variable olvidada en un
perfil de shell convierte cualquier script en apto para producción.

**Propuesta:** dejar la puerta solo en las aditivas y exigir confirmación
interactiva —no una variable— en las destructivas.

### ⚫ G. Bloqueos externos (no se resuelven escribiendo código)

- **Credenciales SUNAT**: las de la empresa 2 están cifradas con un esquema
  retirado cuya clave se eliminó del código a propósito. Ninguna
  `CREDENTIALS_ENCRYPTION_KEY` las recupera — **hay que reingresarlas**
  (usuario y clave SOL, `.p12` con su contraseña, entorno).
- Antes de asumir nada, mirar el diagnóstico en `/settings/integrations` de
  producción: ya clasifica cada credencial sin exponer valores.

---

## 3. Reparto propuesto

La regla que evita choques: **un módulo, un dueño**. Estas semanas hubo
colisiones en `ventas.controller.js` y en el POS por trabajar los dos encima.

| Área | Dueño | Por qué |
|---|---|---|
| **A.** Cambio de talla | Socio | Ya construyó devoluciones; conoce el flujo |
| **B.** Saneamiento de SKU | Claude | Trabajo de datos, irreversible, pide verificación paso a paso |
| **E.** Importador | Claude | Continúa el plan aprobado; el socio ya dejó la base |
| **C.** Carga de costos | Marco | Requiere los números reales del negocio |
| **D.** Planes y precios | Marco | Decisión comercial |
| **G.** Credenciales SUNAT | Marco | Solo el dueño puede reingresarlas |
| **F.** Migraciones destructivas | Los tres | Es política, no código |

---

## 4. Convenciones que no se negocian

Están en `CLAUDE.md`. Se repiten las tres que más se rompieron:

1. **Toda consulta filtra por `id_tenant`** tomado de `req.id_tenant`, nunca del
   body. `scripts/validate-authz.js` audita las rutas — debe salir en 0.
2. **Toda ruta mutante lleva `requireCapability`.** Y si la capacidad es nueva,
   **la migración tiene que sembrar el módulo y subir `perm_version`**. Se
   olvidó en Comprobantes, en cuentas por cobrar y en contabilidad: el síntoma
   es un 403 para todos, sin ningún error que lo explique.
3. **Cero SQL concatenado.** Siempre `?`.

Y una cuarta que salió cara esta semana:

4. **`NODE_ENV` no va en el `.env` de la raíz.** Vite lo lee (`envDir: '..'`) y
   compila el frontend en modo desarrollo sin avisar: React sale en versión de
   desarrollo e `import.meta.env.PROD` queda en false. En local lo aporta
   `nodemon.json`; en producción, el entorno.

---

## 5. Cómo verificar antes de subir

```bash
npm test                       # backend
npm --prefix client-v2 test    # frontend
node scripts/validate-authz.js # debe decir 0 críticos, 0 advertencias
npm --prefix client-v2 run build
```

Y la foto de referencia, que ningún cambio que no sea una operación de negocio
debe alterar:

```sql
SELECT SUM(stock) FROM inventario_stock WHERE id_tenant = 1;  -- 35368
```
