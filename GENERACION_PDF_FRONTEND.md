# Generación de Reportes PDF desde el Frontend

## 📋 Descripción

Se ha implementado la funcionalidad de generación de reportes PDF con análisis AI directamente desde el frontend del chatbot. Los usuarios ahora pueden generar reportes mensuales o anuales con análisis automático de datos utilizando Gemini AI.

## 🎯 Características Implementadas

### 1. **Botón de Acceso Rápido**
- Ubicación: Menú flotante de opciones rápidas (botón de engranaje)
- Icono: FileText
- Texto: "Generar Reporte PDF"

### 2. **Modal de Configuración**
El modal permite configurar:
- **Tipo de reporte**: Mensual o Anual
- **Período**: 
  - Mensual: Selector de mes/año (formato YYYY-MM)
  - Anual: Input numérico de año (formato YYYY)
- **Módulos a incluir**: Checkboxes para seleccionar:
  - ✅ Ventas
  - ✅ Compras
  - ✅ Inventario
  - ✅ Clientes

### 3. **Validaciones**
- Período obligatorio
- Al menos un módulo seleccionado
- Formato de período correcto (YYYY-MM para mensual, YYYY para anual)
- Mensajes de error claros con toast notifications

### 4. **Proceso de Generación**
1. Usuario abre modal desde menú de opciones
2. Selecciona tipo de reporte (mensual/anual)
3. Elige período usando selector nativo
4. Marca módulos a incluir
5. Click en "Generar PDF"
6. Loading state durante generación
7. Descarga automática del PDF
8. Toast de confirmación

## 🔧 Implementación Técnica

### Componentes Añadidos

#### Estados
```javascript
const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
const [pdfConfig, setPdfConfig] = useState({
  type: "mensual", // "mensual" | "anual"
  period: "", // YYYY-MM o YYYY
  modules: [] // ["ventas", "compras", "inventario", "clientes"]
});
const [generatingPDF, setGeneratingPDF] = useState(false);
```

#### Función de Generación
```javascript
const generatePDFReport = async () => {
  // 1. Validaciones de configuración
  // 2. POST a /api/chat/generate-report
  // 3. Recibe blob con responseType: "blob"
  // 4. Descarga automática usando URL.createObjectURL
  // 5. Cleanup y notificaciones
}
```

#### Endpoint Backend
```
POST /api/chat/generate-report
Content-Type: application/json

Body:
{
  "type": "mensual" | "anual",
  "period": "YYYY-MM" | "YYYY",
  "modules": ["ventas", "compras", "inventario", "clientes"]
}

Response:
Content-Type: application/pdf
Binary PDF data
```

## 📱 Interfaz de Usuario

### Modal PDF
- **Tamaño**: 500px de ancho, max 90vw
- **Z-index**: 10001 (sobre el chatbot)
- **Backdrop**: Semi-transparente con click para cerrar
- **Tema**: Soporta modo claro y oscuro
- **Botones**:
  - Cancelar (light variant)
  - Generar PDF (primary color con loading state)

### Selectores
- **Tipo de reporte**: Dos botones toggle (solid cuando activo)
- **Período**: Input nativo (month para mensual, number para anual)
- **Módulos**: Checkboxes con hover effect

## 🎨 Estilos y UX

### Notificaciones (Toast)
- **Loading**: "Generando reporte PDF con análisis AI..."
- **Success**: "Reporte PDF generado exitosamente"
- **Error**: Mensaje específico del servidor o genérico

### Estados Visuales
- **Disabled**: Botón "Generar PDF" deshabilitado si falta período o módulos
- **Loading**: Spinner en botón durante generación
- **Hover**: Efectos en checkboxes y selectores

## 📦 Nombre de Archivo Generado

Formato: `Reporte_{tipo}_{periodo}.pdf`

Ejemplos:
- `Reporte_mensual_2024_01.pdf`
- `Reporte_anual_2024.pdf`

## ⚙️ Configuración Backend

El backend debe tener configurado:
1. Ruta: `POST /api/chat/generate-report`
2. Controller: `chatReportPDF.controller.js`
3. Dependencias: PDFKit, GoogleGenerativeAI
4. Base de datos: MySQL con tablas de ventas, compras, inventario, clientes

## 🔄 Flujo Completo

```
Usuario → Click "Generar Reporte PDF" (Menú)
       ↓
Modal se abre con configuración vacía
       ↓
Usuario selecciona:
  - Tipo: Mensual/Anual
  - Período: 2024-01 o 2024
  - Módulos: [ventas, inventario]
       ↓
Click "Generar PDF"
       ↓
Validaciones frontend
       ↓
POST /api/chat/generate-report
       ↓
Backend:
  1. Valida datos
  2. Consulta MySQL por módulos/período
  3. Genera análisis AI con Gemini
  4. Crea PDF con PDFKit
  5. Retorna blob
       ↓
Frontend recibe PDF
       ↓
Descarga automática
       ↓
Toast de éxito + Modal se cierra + Config reset
```

## 🐛 Manejo de Errores

### Frontend
- Validación de campos vacíos
- Formato de período incorrecto
- Error de red (axios)
- Error del servidor (response.data.message)

### Backend
- Período inválido
- Módulos no permitidos
- Error en consulta MySQL
- Error en generación PDF
- Error en API de Gemini

Todos los errores se muestran con toast.error() con mensaje descriptivo.

## 📝 Notas de Desarrollo

1. **Pattern Usado**: Similar a `quickExportLibroVentas()` - función async con blob download
2. **HeroUI Components**: Button, Card, Divider
3. **Icons**: lucide-react FileText
4. **Toast**: react-hot-toast
5. **HTTP Client**: axios con responseType: "blob"

## 🚀 Próximas Mejoras Sugeridas

- [ ] Selector de rango de fechas personalizado
- [ ] Preview del PDF antes de descargar
- [ ] Guardar configuraciones favoritas
- [ ] Programar generación automática
- [ ] Dashboard de reportes generados
- [ ] Compartir reportes por email
- [ ] Gráficos interactivos en el PDF
- [ ] Exportar a Excel además de PDF

## 📊 Métricas de Implementación

- **Archivos modificados**: 1 (DeepSeekChatbot.jsx)
- **Líneas añadidas**: ~220
- **Estados nuevos**: 3
- **Funciones nuevas**: 1
- **Componentes UI**: 1 modal completo
- **Tiempo estimado de generación**: 10-30 segundos (según datos)

---

**Última actualización**: 2024
**Autor**: Sistema de IA HoryCore
**Versión**: 1.0.0
