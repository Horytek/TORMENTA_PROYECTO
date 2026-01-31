# 📁 REFACTORIZACIÓN DE ESTRUCTURA FRONTEND

## ❌ PROBLEMA DETECTADO

Archivos de servicios y hooks mezclados en carpetas de páginas:
```
client/src/pages/Almacen/data/
  ├── data_guia.js          ← Custom Hook en carpeta de página (MAL)
  ├── insert_guiaremision.js ← Servicio API en carpeta de página (MAL)
  ├── add_vehiculo.js        ← Servicio API en carpeta de página (MAL)
  └── ... 15 archivos más    ← Todo mezclado (MAL)
```

**Problemas**:
- ❌ Hooks y servicios mezclados con páginas
- ❌ Difícil de encontrar y mantener
- ❌ Duplicación de lógica
- ❌ No sigue convenciones de React
- ❌ 18 archivos pequeños en lugar de 1 consolidado

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Nueva Estructura (Mejores Prácticas):

```
client/src/
  ├── hooks/
  │   └── useGuiasRemision.js          ← Custom Hook consolidado
  │
  └── services/
      └── guiaRemision.services.js     ← TODOS los servicios consolidados
```

**Beneficios**:
- ✅ Separación clara de responsabilidades
- ✅ Fácil de encontrar y mantener
- ✅ Sigue convenciones de React
- ✅ Código consolidado y DRY
- ✅ 18 archivos → 2 archivos organizados

---

## 📦 ARCHIVOS CREADOS ✅

### ✅ GUÍAS DE REMISIÓN (COMPLETADO)

1. **`client/src/hooks/useGuiasRemision.js`**
   - Custom Hook para estado y lógica de guías
   - Antes: `pages/Almacen/data/data_guia.js`

2. **`client/src/services/guiaRemision.services.js`**
   - TODOS los servicios API consolidados
   - Antes: 18 archivos separados

### ✅ NOTA DE INGRESO (COMPLETADO)

3. **`client/src/hooks/useNotaIngreso.js`**
   - Hooks: useNotaIngresoData, useAlmacenesIngreso, useDestinatariosIngreso, useDocumentosIngreso
   - Antes: 3 archivos separados

4. **`client/src/services/notaIngreso.services.js`**
   - Servicios consolidados de notas de ingreso
   - Antes: 9 archivos separados

### ✅ NOTA DE SALIDA (COMPLETADO)

5. **`client/src/hooks/useNotaSalida.js`**
   - Hooks: useNotaSalidaData, useAlmacenesSalida, useDestinatariosSalida, useDocumentosSalida
   - Antes: 3 archivos separados

6. **`client/src/services/notaSalida.services.js`**
   - Servicios consolidados de notas de salida
   - Antes: 9 archivos separados

### ✅ KARDEX (COMPLETADO)

7. **`client/src/hooks/useKardex.js`**
   - Hooks: useKardexData, useAlmacenesKardex, useMarcasKardex, useCategoriasKardex, useSubcategoriasKardex
   - Antes: 8 archivos separados

8. **`client/src/services/kardex.services.js`**
   - Servicios consolidados de kardex
   - Antes: 11 archivos separados

**Funciones exportadas**:

#### Guías:
- `insertGuiaRemisionAndDetalle(data)`
- `anularGuia(guiaId)`
- `generarDocumentoGuia()`

#### Destinatarios:
- `getDestinatariosGuia()`
- `addDestinatarioNatural(data)`
- `addDestinatarioJuridico(data)`

#### Transportistas:
- `generarCodigoTransportista()`
- `getTransportistasPublicos()`
- `getTransportistasPrivados()`
- `addTransportistaPublico(data)`
- `addTransportistaPrivado(data)`

#### Vehículos:
- `getVehiculos()`
- `addVehiculo(data, setShowModal)`

#### Auxiliares:
- `getSucursalesGuia()`
- `getUbigeosGuia()`
- `buscarProductosGuia(searchInput, setProductos)`

---

## 🔄 CÓMO MIGRAR (EN TUS COMPONENTES)

### Antes (MAL):
```javascript
// En GuiaRemision.jsx
import useGuiasData from './data/data_guia';
import insertGuiaRemisionAndDetalle from './data/insert_guiaremision';
import anularGuia from './data/anular_guia';
import addVehiculo from './data/add_vehiculo';
// ... 15 imports más
```

### Ahora (BIEN):
```javascript
// En GuiaRemision.jsx
import useGuiasRemision from '@/hooks/useGuiasRemision';
import guiaRemisionService from '@/services/guiaRemision.services';

// O importar funciones específicas:
import { 
  insertGuiaRemisionAndDetalle,
  anularGuia,
  addVehiculo 
} from '@/services/guiaRemision.services';
```

---

## 📝 EJEMPLOS DE USO

### 1. Usando el Custom Hook:

```javascript
function GuiaRemisionPage() {
  const [filters, setFilters] = useState({ numGuia: '', documento: '' });
  
  const { 
    guias, 
    currentPage, 
    setCurrentPage, 
    totalPages,
    addGuia,
    removeGuia,
    refetchGuias 
  } = useGuiasRemision(filters);
  
  return (
    <div>
      {/* Tu UI aquí */}
    </div>
  );
}
```

### 2. Usando los Servicios:

```javascript
import guiaRemisionService from '@/services/guiaRemision.services';

async function handleCrearGuia(data) {
  const result = await guiaRemisionService.insertGuiaRemisionAndDetalle(data);
  
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
}

async function handleAnularGuia(id) {
  const result = await guiaRemisionService.anularGuia(id);
  // ...
}
```

### 3. Importando Funciones Específicas:

```javascript
import { 
  insertGuiaRemisionAndDetalle,
  anularGuia,
  getVehiculos 
} from '@/services/guiaRemision.services';

async function handleSubmit(data) {
  const result = await insertGuiaRemisionAndDetalle(data);
  // ...
}
```

---

## 🗑️ ARCHIVOS A ELIMINAR (Después de Migrar)

Una vez que actualices todos los imports en tus componentes, puedes eliminar:

```
client/src/pages/Almacen/data/
  ├── data_guia.js                    ← Ahora: hooks/useGuiasRemision.js
  ├── insert_guiaremision.js          ← Ahora: services/guiaRemision.services.js
  ├── anular_guia.js                  ← Ahora: services/guiaRemision.services.js
  ├── add_vehiculo.js                 ← Ahora: services/guiaRemision.services.js
  ├── add_transportistapub.js         ← Ahora: services/guiaRemision.services.js
  ├── add_transportistapriv.js        ← Ahora: services/guiaRemision.services.js
  ├── add_dest_natural.js             ← Ahora: services/guiaRemision.services.js
  ├── add_dest_juridico.js            ← Ahora: services/guiaRemision.services.js
  ├── data_buscar_producto.js         ← Ahora: services/guiaRemision.services.js
  ├── generar_doc_guia.js             ← Ahora: services/guiaRemision.services.js
  ├── generar_cod_trans.js            ← Ahora: services/guiaRemision.services.js
  ├── data_vehiculos_guia.js          ← Ahora: services/guiaRemision.services.js
  ├── data_ubigeo_guia.js             ← Ahora: services/guiaRemision.services.js
  ├── data_transpriv.js               ← Ahora: services/guiaRemision.services.js
  ├── data_transpub.js                ← Ahora: services/guiaRemision.services.js
  ├── data_sucursal_guia.js           ← Ahora: services/guiaRemision.services.js
  ├── data_cliente_guia.js            ← Ahora: services/guiaRemision.services.js
  └── add_sunat_guia.js               ← Ahora: services/guiaRemision.services.js
```

**⚠️ NO ELIMINES** hasta actualizar todos los imports en tus componentes.

---

## 🎯 VENTAJAS DE LA NUEVA ESTRUCTURA

### Antes:
- 18 archivos pequeños dispersos
- Difícil encontrar la función correcta
- Imports largos y repetitivos
- No sigue convenciones React

### Ahora:
- 2 archivos bien organizados
- Todo en un solo lugar
- Imports limpios
- Sigue mejores prácticas de React

---

## 📋 PLAN DE MIGRACIÓN

### Paso 1: Actualizar Imports en Componentes

Busca en tus componentes de Almacén:
```javascript
// Buscar y reemplazar:
import ... from './data/...'
// Por:
import { ... } from '@/services/guiaRemision.services'
```

### Paso 2: Probar que Todo Funciona

- Prueba crear guía
- Prueba anular guía
- Prueba agregar transportista
- Etc.

### Paso 3: Eliminar Archivos Antiguos

Cuando TODO funcione correctamente, elimina la carpeta:
```bash
rm -rf client/src/pages/Almacen/data
```

---

## 💡 MEJORES PRÁCTICAS APLICADAS

### ✅ Separación de Responsabilidades
- **Hooks**: Estado y lógica de UI → `/hooks/`
- **Services**: Llamadas API → `/services/`
- **Components**: UI y render → `/components/` o `/pages/`

### ✅ Naming Conventions
- **Hooks**: `use[Nombre].js` (ej: `useGuiasRemision.js`)
- **Services**: `[entidad].services.js` (ej: `guiaRemision.services.js`)
- **Components**: `[Nombre].jsx` (ej: `GuiaRemision.jsx`)

### ✅ Single Responsibility
- Cada archivo tiene un propósito claro
- Fácil de encontrar y mantener
- Código DRY (Don't Repeat Yourself)

### ✅ Tree-Shaking Friendly
- Exports nombrados permiten tree-shaking
- Bundle más pequeño en producción
- Mejor rendimiento

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. **Aplicar la misma refactorización** a:
   - `client/src/services/data/` (ventas)
   - `client/src/services/client_data/` (clientes)
   - `client/src/services/reports/` (reportes)

2. **Consolidar servicios similares**:
   - Cada entidad = 1 archivo de servicio
   - Cada funcionalidad = 1 custom hook

3. **Resultado final ideal**:
   ```
   client/src/
     ├── hooks/
     │   ├── useGuiasRemision.js
     │   ├── useVentas.js
     │   ├── useClientes.js
     │   └── useReportes.js
     │
     └── services/
         ├── guiaRemision.services.js
         ├── ventas.services.js
         ├── clientes.services.js
         └── reportes.services.js
   ```

---

## ✅ BENEFICIOS

- 📦 Código más limpio y organizado
- 🔍 Fácil de encontrar funciones
- 🚀 Mejor rendimiento (tree-shaking)
- 📚 Más fácil de documentar
- 🧪 Más fácil de testear
- 👥 Mejor para trabajo en equipo

---

¿Quieres que actualice los imports en tus componentes y complete la migración?

