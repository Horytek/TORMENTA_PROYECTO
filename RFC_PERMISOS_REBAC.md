# RFC — Autorización ReBAC (Zanzibar / OpenFGA) para Horytek ERP

> Estado: **propuesta para revisión** (no implementado). Decisión tomada:
> avanzar hacia ReBAC estilo Zanzibar. Este documento define el modelo, la
> integración, la coexistencia con lo que ya existe, y un plan de migración
> **no destructivo** por fases. Continúa `PLAN_PERMISOS_PLAN_ROLES.md`.
>
> Reglas transversales del proyecto que este diseño NO puede violar (CLAUDE.md):
> aislamiento por `id_tenant` (Regla de Oro Nº1), facturación/SUNAT sagradas
> (Nº3), y no introducir estado en memoria que asuma instancia única (§10).

---

## 1. Por qué ReBAC (y qué problema resuelve)

Hoy el permiso es `rol × módulo × 6 flags` (+ dimensión plan). Dos límites de fondo:

1. **Rígido y hardcodeado**: cada permiso nuevo obliga a tocar código (registrar
   acción, envolver botón) — incluso con `<Can>`, el acoplamiento sigue.
2. **No entiende el mundo real**: no sabe "esta venta es de *mi* sucursal",
   "soy *jefe de* esta caja", "puedo anular *hasta* S/ 200". Solo sabe
   "rol X puede anular ventas (todas)".

**ReBAC (Relationship-Based Access Control)** —el modelo de Google Zanzibar,
implementado por **OpenFGA** (CNCF), SpiceDB, Auth0 FGA— responde la pregunta
como una consulta sobre un **grafo de relaciones**:

> ¿Existe un camino de relaciones entre `usuario:13` y `venta:42` que otorgue la
> acción `anular`?

En vez de flags por rol, guardas **tuplas de relación** (`objeto#relación@sujeto`)
y preguntas al motor `Check(user, action, object)`. Las acciones/recursos no se
"registran" a mano: emergen del **modelo de autorización** + las tuplas.

## 2. Conceptos Zanzibar mapeados a Horytek

| Zanzibar | En Horytek |
|---|---|
| **Type** (tipo de objeto) | `tenant`, `empresa`, `sucursal`, `almacen`, `modulo`, `venta`, `producto`, `nota`, `user` |
| **Relation** (relación) | `admin`, `manager`, `worker`, `owner`, `viewer`, `member` |
| **Tuple** (`object#relation@subject`) | `sucursal:5#manager@user:13` = "el user 13 es jefe de la sucursal 5" |
| **Userset** (grupo por relación) | `sucursal:5#worker` = "todos los trabajadores de la sucursal 5" |
| **Check API** | `Check(user:13, can_anular, venta:42)` → allow/deny |
| **Expand / ListObjects** | "¿qué ventas puede ver el user 13?" (para el permission-aware API) |

**Los roles se vuelven relaciones con alcance (scope).** "Vendedor de la
sucursal Norte" = tupla `sucursal:norte#worker@user:13`, no un `id_rol` global.
Eso es lo que da el permiso por-sucursal / por-recurso que hoy no existe.

## 3. Modelo de autorización (OpenFGA DSL)

```dsl
model
  schema 1.1

type user

type tenant
  relations
    define owner: [user]              # titular de la suscripción (hoy id_rol=1)
    define admin: [user] or owner
    define member: [user] or admin

type empresa
  relations
    define parent: [tenant]
    define admin: admin from parent

type sucursal
  relations
    define parent: [empresa]
    define manager: [user]            # jefe de caja/tienda
    define worker: [user]             # cajero/vendedor
    define member: worker or manager or admin from parent

type almacen
  relations
    define parent: [sucursal, empresa]
    define keeper: [user]             # almacenero
    define can_view:   keeper or member from parent
    define can_manage: keeper or manager from parent or admin from parent

# ── Recurso-instancia con acciones propias (aquí desaparece la matriz fija) ──
type venta
  relations
    define parent: [sucursal]
    define seller: [user]             # quien la registró (venta.u_modifica)
    define can_view:   seller or member from parent
    define can_create: worker from parent or manager from parent
    define can_anular: manager from parent or admin from parent   # ← acción NO-CRUD, sin columna fija
```

Puntos clave:
- **Cada tipo declara SOLO sus acciones reales** (`venta` tiene `can_anular`;
  `almacen` no). Esto **elimina de raíz** la matriz de 6 columnas donde "generar"
  aparecía en módulos que no lo tienen.
- **Herencia por el grafo**: `admin from parent` sube por tenant→empresa→sucursal
  sin repetir tuplas. Dar `tenant#admin@user:1` propaga a todo.
- Las **acciones no-CRUD** (`anular`, `aprobar_descuento`) son relaciones más;
  no hay catálogo paralelo ni `active_actions`.

## 4. Tuplas de ejemplo (derivadas de tus datos actuales)

| Hoy (tabla) | Tupla ReBAC |
|---|---|
| `usuario(id=1, id_rol=1, tenant=1)` (titular) | `tenant:1#owner@user:1` |
| `usuario(id=13, id_rol=10)` (developer) | *(fuera de ReBAC — bypass global, ver §6)* |
| vendedor id=20 en sucursal Norte (id=5) | `sucursal:5#worker@user:20` |
| `venta(id=42, id_sucursal=5, u_modifica=20)` | `venta:42#parent@sucursal:5`, `venta:42#seller@user:20` |
| empresa 2 del tenant 1 | `empresa:2#parent@tenant:1` |

Un **servicio de sincronización** (estilo `PlanSynchronizer`) proyecta la BD
relacional → tuplas, y las mantiene con hooks en los escritores (crear venta →
escribe `venta:X#parent@sucursal:Y`). Ver §7.

## 5. La dimensión PLAN **no** entra a ReBAC (importante)

ReBAC responde *"¿quién puede hacer qué sobre qué?"*. El **plan de suscripción**
(qué módulos desbloquea el plan) es una pregunta distinta —de negocio/facturación—
y ya está resuelta con `plan_template_version` + entitlements (Fase E4).

**El permiso efectivo = plan_incluye(recurso) ∧ ReBAC.Check(user, acción, recurso).**

- Plan = **techo** por suscripción (se mantiene tal cual, zona ligada a cobros).
- ReBAC = quién-puede-qué **dentro** de lo que el plan permite.

Forzar el plan dentro de ReBAC sería un error (mezclaría facturación con
autorización). Se evalúan en capas: primero el techo de plan (barato, cacheado),
luego el Check ReBAC.

## 6. Enforcement — cómo se usa sin hardcodear botones

**Backend** — un único middleware de autorización que infiere `(acción, recurso)`
de la ruta y llama al motor:

```js
// POST /ventas/:id/anular  → check(user, "can_anular", `venta:${id}`)
router.post("/ventas/:id/anular", authorize("can_anular", "venta"), controller.anular);
```

**Frontend — cero strings de permiso, cero `<Can>` manual.** La API **incrusta
los permisos por registro** (patrón permission-aware / HATEOAS), resueltos con
`BatchCheck`/`ListObjects`:

```json
GET /ventas → [{ "id": 42, "total": 1200, "_can": ["view", "anular"] }]
```

Un componente genérico (tabla/toolbar) pinta los botones **desde `_can`**. Agregar
la acción `aprobar_descuento` en el modelo → aparece en `_can` → el botón sale
solo. **Ningún cambio de frontend, nunca**, y con permiso **a nivel de fila** gratis.

**Developer (rol 10)** sigue siendo bypass global fuera de ReBAC (como hoy
`isDeveloperReq`), para no depender del grafo en soporte/emergencias.

## 7. Multi-tenancy y fuente de verdad (las 2 decisiones críticas)

**A. Aislamiento de tenant en OpenFGA.** Dos estrategias:
- **Store por tenant**: aislamiento fuerte (un grafo por cliente), imposible
  cruzar datos; más stores que administrar. **Recomendado** dada la Regla de Oro Nº1.
- Store único con `tenant` como objeto raíz: menos operativa, pero un bug de
  modelado podría cruzar tenants.
- En ambos casos se mantiene el filtro `id_tenant` en SQL como **defensa en
  profundidad** (nunca se quita).

**B. Fuente de verdad de las tuplas.** MySQL sigue siendo autoritativo del
negocio; OpenFGA es un **índice de autorización derivado**. Un servicio de sync
(hooks en los escritores + un reconciliador batch) mantiene las tuplas. Ventaja:
si OpenFGA se cae o se desincroniza, se re-deriva desde MySQL; nunca es la única
copia de un dato de negocio.

## 8. Infra y encaje con §10 (escala)

- **OpenFGA self-host** (contenedor) con datastore en **MySQL** (OpenFGA lo
  soporta nativamente) — reusa tu motor de BD, en un schema aparte.
- A favor de §10: OpenFGA es un **servicio stateful respaldado por BD**, no
  estado en memoria del proceso Node. Es decir, **mejora** la escalabilidad vs
  meter más lógica en la instancia única de Azure.
- Alternativa gestionada: **Auth0 FGA / Okta** (mismo modelo, sin operar server)
  — evita ops a cambio de dependencia externa y latencia de red.
- Latencia: se mitiga con caché por `perm_version` (ya existe) + caché de OpenFGA;
  el permission-aware API usa `BatchCheck` (una llamada por lista).

## 9. Plan de migración — NO destructivo, con shadow mode

Reusa el patrón `AUTHZ_UNIFIED` (Fase 1): correr lo nuevo en sombra antes de darle
el mando.

| Fase | Entregable | Riesgo |
|---|---|---|
| **R0 — POC** | OpenFGA local (Docker + datastore MySQL), modelo §3 cargado, `rebacCheck()` wrapper, seed manual de tuplas de 1 tenant. Comparar `Check` vs el resolver actual en 2–3 endpoints. | Bajo (aislado, local) |
| **R1 — Sync** | Servicio que proyecta MySQL→tuplas (usuarios/roles/sucursales/ventas) + hooks en escritores. Reconciliador batch idempotente. | Medio (consistencia) |
| **R2 — Permission-aware API** | `_can` por registro en list/detail vía `BatchCheck`; componente genérico de acciones en client-v2. Mata el `<Can>` manual. | Medio |
| **R3 — ABAC** | Condiciones OpenFGA (relaciones condicionales / contextual tuples): monto, sucursal, horario. El diferencial vendible. | Medio |
| **R4 — Flip** | `AUTHZ_ENGINE=rebac`: el enforcement pasa a ReBAC tras ≥1 semana sin divergencias en shadow. Retirar flags/legacy gradualmente. | Alto (gate real) |
| **R5 — Admin UX** | Editor de relaciones, "ver como" (simular), "por qué" (OpenFGA `Expand`), plantillas de rol por industria, avisos SoD. | Bajo |

DoD por fase (igual que el backlog): migración reversible, shadow sin divergencias,
auditoría activa, feature flag, y salida idéntica antes de flip.

## 10. Riesgos y mitigaciones

- **Nueva pieza de infra/ops** → self-host con MySQL (ya lo operas) o FGA gestionado.
- **Desincronización de tuplas** → MySQL autoritativo + reconciliador; OpenFGA re-derivable.
- **Aislamiento de tenant** → store-por-tenant + filtro SQL como defensa en profundidad.
- **Latencia** → BatchCheck + caché por `perm_version`.
- **Curva de aprendizaje del modelado** → empezar por un dominio (ventas) en R0.
- **No mezclar plan/facturación** → plan queda como capa aparte (§5).
- **Zona sagrada (SUNAT/pagos)** → esos flujos solo suman el check, nunca cambian lógica; PRs chicos y con confirmación.

## 11. Decisiones abiertas (para decidir antes de R1)

1. **Self-host (OpenFGA + MySQL) vs gestionado (Auth0 FGA)** — ops vs dependencia.
2. **Store por tenant vs store único** con tenant como objeto — aislamiento vs operativa.
3. **Alcance del POC (R0)**: ¿ventas + anulación como primer dominio? (recomendado —
   es el caso con más jugo: por-sucursal + acción no-CRUD + futura condición de monto).
4. **¿SpiceDB/Cedar en vez de OpenFGA?** OpenFGA: CNCF, DSL simple, datastore MySQL,
   FGA gestionado disponible → recomendado para este stack.

## 12. Próximo paso concreto

Levantar **R0 (POC)** en local: OpenFGA en Docker con datastore MySQL, cargar el
modelo de §3, sembrar tuplas del tenant 1 para el dominio **ventas**, y un
`rebacCheck()` en **shadow** contra el resolver actual en el endpoint de anulación
de ventas. Sin tocar el enforcement real. Requiere: Docker disponible en tu
entorno y confirmar las 4 decisiones abiertas de §11 (al menos self-host vs
gestionado y el dominio del POC).
