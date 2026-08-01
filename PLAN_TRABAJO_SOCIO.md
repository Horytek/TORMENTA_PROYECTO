# Plan de trabajo — reparto con el socio técnico

> Fecha: 2026-07-25 · Rama: `feature/frontend-v2`
> Documento para trabajar sin depender de una conversación. Si algo acá
> contradice al código, **el código gana**: avisa de la discrepancia.
>
> ⚠️ **2026-08-01: fusionado en `PLAN_MAESTRO_CLAUDE_CODE.md`.** Este archivo
> quedó desactualizado (la mayoría de §3.1-3.5 ya se completó: costo en nota de
> ingreso, costo al vender, UI de captura, pantalla de márgenes, ciclo de
> compra completo, cod_barras por SKU, exoneradas/inafectas en UBL). Lo que
> seguía pendiente (modo offline, aprovisionamiento de permisos, throttle
> SUNAT, nota de débito/liquidación, bloqueo de credenciales SUNAT) está
> reflejado ahí. Usa `PLAN_MAESTRO_CLAUDE_CODE.md` como fuente de verdad; este
> archivo queda solo como contexto histórico de la decisión estratégica de
> verticalizar en ropa (§1) y las convenciones (§4).

---

## 1. Contexto en una página

Horytek ERP es un **ERP + POS multi-tenant** para PYMES peruanas. El cliente
real de hoy es **retail de ropa** (TEXTILES CREANDO MODA S.A.C., Chiclayo):
producto con variantes talla × color, temporada, material.

La decisión estratégica de esta semana, después de investigar competidores y
tesis del norte:

- **Verticalizar en ropa**, profundo, en Chiclayo y Trujillo — no competir como
  ERP genérico contra Bsale, INVY y OKFAC, que ya tienen offline, IA, Yape y
  SIRE en la banda de S/140–380.
- **El argumento de venta es el margen**, no el control de inventario. Un
  estudio USAT 2025 sobre 264 comerciantes de prendas en Chiclayo encontró que
  la estrategia dominante es liderazgo en costos (97 de 264) — compiten bajando
  precios. Y otro estudio local halló que **66.67% ya cree que controla bien su
  inventario**. Vender "mejor inventario" es cuesta arriba; vender "cuánto ganas
  por prenda" no.
- La arquitectura se mantiene **agnóstica al rubro** (atributos genéricos por
  SKU) para poder expandirse después, pero **no se construye multi-vertical
  ahora**.

---

## 2. Estado verificado (no supuesto)

### Lo que está hecho y funcionando

| Área | Estado |
|---|---|
| Variantes SKU | Sólido. `producto_sku` (1686), `sku_atributo_valor` (3337), `inventario_stock` (3103) con `stock` y `reservado`. La tabla vieja `inventario` quedó en 0 filas: la migración se completó bien. |
| Facturación electrónica (CPE) | Emisión desde servidor, idempotente, persiste XML + CDR. Estado derivado del ResponseCode, no del HTTP. Pantalla "Comprobantes electrónicos". |
| Pantalla Integraciones | Diagnostica credenciales SUNAT y certificado sin exponer secretos. |
| Modelo de costo | Cálculo puro + migración + capa de datos + origen configurable por empresa. **Commiteado y empujado.** |
| Tests backend | 112, corren en ~1.5 s sin BD ni red (`npm test`). Antes eran cero. |

### Lo que está a medias — atención

**`src/controllers/notaingreso.controller.js`**: el insert ya guarda
`costo_unitario` y `origen_costo` en `detalle_nota`, pero **falta el paso que
recalcula el costo promedio del SKU**. Sin eso el costo se registra pero no se
propaga. Es el punto 3.1 de abajo.

**`src/controllers/ventas.controller.js`**: tiene cambios sin commitear del CEO.
**Nadie más debe tocar ese archivo** hasta que se commiteen. Ahí va la captura
del costo al vender (punto 3.2).

### Lo que falta y es grande

- **No existe ciclo de compra.** Cero tablas de compras, cuentas por pagar,
  anticipos o impuestos especiales. La mercadería entra por nota de almacén, que
  no registra dinero.
- **No hay SIRE.** Bsale y OKFAC sí lo tienen. `exportarRegistroVentas` genera un
  Excel, no el formato que SUNAT exige.
- **No hay modo offline.** Cero service worker, cero cola local. INVY y OKFAC lo
  tienen. Si se cae internet, la caja muere.
- **`producto_sku.cod_barras` está en NULL.** Sin código por talla×color el POS
  no distingue una M de una L al escanear.
- **Faltan documentos**: nota de débito y liquidación de compra. El builder UBL
  solo arma operaciones gravadas (nada exonerado ni inafecto).
- **Permisos sin aprovisionamiento.** Agregar una capacidad nueva exige sembrar
  ~60 filas a mano (5 roles × 12 tenants) y no existe ningún script que lo haga.
  Por eso hay 89 chequeos de rol developer hardcodeados en el backend.

### Bloqueo externo (no es código)

La emisión SUNAT **nunca completó en verde**. Las 9 filas de `clave` de la
empresa 2 están cifradas con el esquema anterior a `v1:` y no se pueden leer.
**Hay que reingresar desde el panel**: usuario y clave SOL, certificado `.p12`
con su contraseña, y el entorno (`beta`). Hasta entonces no se puede medir
cuánto tarda SUNAT de verdad.

---

## 3. Trabajo en orden de prioridad

### 3.1 Cerrar el costo en la nota de ingreso — **primero**

**Archivo**: `src/controllers/notaingreso.controller.js`

Falta aplicar el costo al promedio del SKU. Reglas que no se pueden saltar:

1. Llamar a `aplicarIngresoAlCosto` (`src/services/costos/costoRepository.js`)
   **ANTES** de incrementar el stock. El promedio pondera contra el stock previo;
   si se llama después, la cantidad entrante se cuenta dos veces.
2. **Solo en ingresos reales**: si `almacenO` viene con valor es un traslado
   entre almacenes — esa mercadería ya tiene costo y recalcularlo lo duplicaría.
   Aplicar costo únicamente cuando `!almacenO`.
3. **Agrupar por SKU antes de aplicar.** Si el mismo SKU aparece en dos líneas
   de la misma nota, hay que sumar cantidades y ponderar sus costos, y aplicar
   una sola vez. Aplicar línea por línea pondera contra un stock desactualizado.
4. Todo dentro de la transacción que ya existe.

**Terminado cuando**: se registra una nota con costos y `producto_sku.costo_promedio`
queda con el valor ponderado correcto; un traslado entre almacenes no lo altera.

### 3.2 Captura del costo al vender — **bloqueado por el WIP del CEO**

**Archivo**: `src/controllers/ventas.controller.js` (esperar a que se commitee)

Al insertar `detalle_venta`, guardar `costo_unitario` con el costo vigente del
SKU. Usar `obtenerCostosVigentes` (una consulta para todos los SKUs, no una por
línea).

**Por qué importa**: es una **foto**. Si el margen se calculara contra el costo
actual del SKU, cada cambio de costo reescribiría el margen de todas las ventas
pasadas y los informes del mes anterior dejarían de cuadrar. Es la pieza cara de
retrofitear después.

### 3.3 UI de captura de costo

**Dónde**: formulario de nota de ingreso en `client-v2`.

Agregar el campo de costo por línea. **Las etiquetas las manda el backend**:
`GET /api/negocio` devuelve `origen_vocabulario` con `campoCosto` y `ayudaCosto`
según el negocio sea de compra, fabricación o mixto. No duplicar esos textos en
el frontend — se desincronizan.

Si `origen_elegible_por_linea` es `true` (empresa MIXTO), mostrar el selector de
origen; si no, no preguntar nada.

### 3.4 Pantalla de márgenes

`costoRepository.js` ya tiene `obtenerMargenPorPeriodo` y `valorizarInventario`.
Falta endpoint + vista.

**Importante**: ambas funciones informan **cobertura** — qué porcentaje del stock
o de las ventas tiene costo conocido. Hay que mostrarla. Con 0.3% de cobertura
hoy, presentar un margen sin ese contexto sería engañar al usuario.

### 3.5 Ciclo de compra

El hueco estructural. Documento de compra con importes, cuenta corriente de
proveedor, anticipos, y que la entrada a almacén nazca de la compra. Esto es
alcance estándar de ERP que los competidores tienen y nosotros no.

**Diseñar antes de codear.** Vale una sesión de diseño aparte.

### 3.6 SIRE y modo offline

Paridad competitiva, no diferenciación. Van después del costo porque el dolor
que el dueño **siente** es el margen; SIRE lo sufre su contador.

---

## 4. Convenciones que hay que respetar

Salieron de errores reales de esta semana. No son preferencias.

**`id_tenant` en todo WHERE de negocio**, tomado de `req.id_tenant` (del JWT),
nunca del body. Regla de Oro Nº1 de `CLAUDE.md`.

**Los nombres de acción difieren entre capas.** El backend usa el español porque
es una columna SQL: `requireCapability("ventas", "generar")`. El frontend usa el
inglés: `capability="ventas.generate"`. `ACTION_COLUMNS` en `authz.service.js`
traduce. **Mezclarlos falla en silencio**: el botón simplemente no aparece, sin
error ni 403. Costó una hora encontrarlo.

**Cuidado con `Number(null)`, que es `0`.** Mordió dos veces esta semana: un CDR
ilegible se clasificaba como ACEPTADO, y una venta sin costo mostraba 100% de
margen. Descartar null y vacío **antes** de convertir.

**Lógica pura → módulo aparte + test.** `npm test` corre en 1.5 s sin BD ni red.
Si un test necesita conexión, es señal de que la lógica debe salir del
controlador. Ver `src/services/costos/` y `src/services/sunat/` como referencia.

**Las migraciones llevan guard de host local, son idempotentes y se corren dos
veces** para comprobarlo. Patrón en `scripts/migrations/`.

**Commit y push en el mismo paso.** Un commit sin empujar no existe para el
resto del equipo.

**Antes de empujar**: `npm test` y `node scripts/validate-authz.js` (debe dar 0
críticos, 0 advertencias).

---

## 5. Cómo repartirse

**CEO** — el trabajo que nadie más puede hacer:

- Salir a hablar con **15–20 tiendas de ropa** en Chiclayo y Trujillo. Dos
  preguntas centrales: *¿cómo decides el precio de una prenda?* y *¿qué haces
  con lo que no se vendió de la temporada pasada?*
- Leer **The Mom Test** antes de esas entrevistas (dos noches).
- **Reingresar las credenciales SUNAT** — bloquea toda la verificación fiscal.
- Decidir precio: el mercado paga S/300–400 por un vertical que resuelve el
  problema (restaurant.pe cobraba S/350–450 desde 2016). No competir en el piso
  de S/140.

**Socio técnico** — la ejecución:

- Puntos 3.1 → 3.4 en ese orden.
- No tocar `ventas.controller.js` hasta que el CEO commitee.
- 3.5 (compras) requiere diseño previo, no empezar en caliente.

---

## 6. Riesgos abiertos

| Riesgo | Estado |
|---|---|
| Credenciales SUNAT ilegibles | Bloquea verificación fiscal. Solo el CEO puede resolverlo. |
| El vertical no está validado con clientes | Todo el plan asume ropa. 20 entrevistas lo confirman o lo tumban en 2 semanas. |
| Throttle de SUNAT global por proceso | 6 comprobantes/minuto para **todos** los tenants. Se resuelve con outbox + worker, misma pieza que offline. |
| Permisos sin aprovisionamiento | Cada pantalla nueva nace invisible o se gatea por rol hardcodeado. ~1 semana arreglarlo. |
| Cobertura de costo en 0.3% | Los márgenes no serán representativos hasta que entre mercadería con costo. |

---

## 7. Calibración

restaurant.pe — la referencia, nacida en Piura — se fundó en 2016, tuvo **70
clientes a los dos años** y hoy, diez años después, tiene 2,600 en siete países.

Un plan realista a tres años para nosotros: 80–150 clientes de ropa en Chiclayo
y Trujillo, S/30,000–50,000 mensuales recurrentes, equipo chico que se paga
solo. Eso es un buen negocio. No es una salida millonaria a corto plazo, y
conviene que ambos socios estén de acuerdo en ese horizonte antes de
comprometer los próximos dos años.
