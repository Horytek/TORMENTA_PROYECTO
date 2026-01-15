# 🌪️ PROYECTO TORMENTA - ERP/POS Sistema

Sistema de gestión empresarial (ERP) con punto de venta (POS) integrado.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Comandos Disponibles](#-comandos-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🔧 Requisitos Previos

- **Node.js**: versión 20 o superior
- **MySQL**: versión 8.0 o superior
- **npm**: incluido con Node.js

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd TORMENTA_PROYECTO
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del backend (raíz)
npm install

# Instalar dependencias del frontend
cd client
npm install
cd ..
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la carpeta raíz del proyecto con las siguientes variables:

```env
# ========== Base de Datos ==========
DB_HOST=localhost
DB_DATABASE=db_tormenta
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_PORT=3306

# ========== Servidor ==========
NODE_ENV=development
TOKEN_SECRET=tu_secreto_seguro_aqui

# ========== URLs ==========
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000/api

# ========== APIs Externas (Opcionales) ==========
VITE_GOOGLE_MAPS_API_KEY=tu_api_key
VITE_OPENROUTER_API_KEY=tu_api_key
OPENAI_API_KEY=tu_api_key

# ========== MercadoPago (Opcional) ==========
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key
ACCESS_TOKEN=tu_access_token

# ========== Email (Opcional) ==========
RESEND_API_KEY=tu_resend_api_key
SUPPORT_EMAIL=tu_email@ejemplo.com
```

> **Nota**: El frontend (Vite) puede leer las variables `VITE_*` desde el archivo `.env` en la raíz.

---

## 🚀 Comandos Disponibles

### Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia solo el servidor backend (Express) |
| `npm run client` | Inicia solo el cliente (React + Vite) |
| `npm run dev:full` | Inicia backend y frontend simultáneamente |
| `npm run dev:fullstack` | Igual que `dev:full` pero con colores en consola |

### Producción

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run build:client` | Compila el cliente para producción |

### Seguridad

| Comando | Descripción |
|---------|-------------|
| `npm run security:install` | Instala bcryptjs para hash de contraseñas |
| `npm run migrate:passwords` | Migra contraseñas a formato hasheado (ejecutar UNA vez) |

---

## 📁 Estructura del Proyecto

```
TORMENTA_PROYECTO/
├── client/                 # Frontend (React + Vite)
│   ├── src/               # Código fuente del cliente
│   ├── public/            # Archivos estáticos
│   ├── package.json       # Dependencias del frontend
│   └── vite.config.js     # Configuración de Vite
│
├── src/                    # Backend (Express)
│   ├── controllers/       # Controladores de rutas
│   ├── routes/            # Definición de rutas API
│   ├── middlewares/       # Middlewares (auth, rate limiting)
│   ├── database/          # Configuración de base de datos
│   ├── services/          # Servicios y lógica de negocio
│   └── utils/             # Utilidades y helpers
│
├── api/                    # Punto de entrada para Vercel
├── scripts/                # Scripts de migración y utilidades
├── uploads/                # Archivos subidos por usuarios
├── index.js                # Punto de entrada del servidor
├── vercel.json             # Configuración de Vercel
└── package.json            # Dependencias del backend
```

---

## 💻 Desarrollo

### Iniciar entorno de desarrollo completo

```bash
# Opción 1: En terminales separadas
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

```bash
# Opción 2: Todo junto (recomendado)
npm run dev:fullstack
```

### Puertos por defecto

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend API | 4000 | http://localhost:4000/api |
| Frontend | 5173 | http://localhost:5173 |

---

## 🌐 Despliegue

### Vercel (Recomendado)

El proyecto está configurado para Vercel con el archivo `vercel.json`:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el panel de Vercel
3. Despliega automáticamente con cada push

### Manual

```bash
# Compilar el cliente
npm run build:client

# Iniciar en producción
npm start
```

---

## 🔐 Seguridad

> ⚠️ **IMPORTANTE**: Ejecuta estos pasos antes de ir a producción.

### Configuración inicial de seguridad

```bash
# 1. Instalar bcryptjs
npm run security:install

# 2. Migrar contraseñas a formato seguro (solo una vez)
npm run migrate:passwords

# 3. Reiniciar el servidor
npm run dev
```

### Características de seguridad implementadas

- ✅ **Contraseñas hasheadas** con bcrypt
- ✅ **Rate limiting**: máximo 5 intentos fallidos por IP
- ✅ **Bloqueo temporal** de 15 minutos tras intentos fallidos
- ✅ **JWT robusto** con validación completa
- ✅ **Logs de seguridad** para intentos sospechosos

Para más detalles, consulta `INSTRUCCIONES_SEGURIDAD.md`.

---

## 🔧 Solución de Problemas

### Error: "bcryptjs not found"

```bash
npm install bcryptjs
```

### Error: "Cannot find module"

```bash
npm install
npm run dev
```

### Los usuarios no pueden iniciar sesión

```bash
# Asegúrate de ejecutar la migración de contraseñas
npm run migrate:passwords
```

### Error de conexión a base de datos

1. Verifica que MySQL esté corriendo
2. Confirma las credenciales en `.env`
3. Asegúrate que la base de datos `db_tormenta` exista

### El frontend no carga datos

1. Verifica que el backend esté corriendo en el puerto 4000
2. Confirma que `VITE_API_URL` en `.env` sea correcto
3. Revisa la consola del navegador por errores CORS

---

## 📚 Documentación Adicional

| Archivo | Descripción |
|---------|-------------|
| `INSTRUCCIONES_SEGURIDAD.md` | Guía completa de seguridad |
| `GUIA_REFACTOR_PERMISOS.md` | Documentación del sistema de permisos |
| `RESUMEN_OPTIMIZACIONES.md` | Optimizaciones implementadas |
| `nueva_arquitectura.md` | Arquitectura del sistema |

---

## 🛠️ Stack Tecnológico

### Backend
- **Express.js 5** - Framework web
- **MySQL** + **Sequelize** - Base de datos
- **JWT** - Autenticación
- **Socket.io** - Comunicación en tiempo real
- **Nodemailer/Resend** - Envío de emails

### Frontend
- **React 19** - Biblioteca UI
- **Vite** - Bundler
- **TailwindCSS 4** - Estilos
- **HeroUI/Radix** - Componentes UI
- **Zustand** - Estado global
- **React Router** - Navegación

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda, crea un issue en el repositorio.