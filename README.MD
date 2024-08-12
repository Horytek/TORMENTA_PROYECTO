# PROYECTO TORMENTA:

## Comandos principales:

- **Iniciar Aplicación/Servidor**
```
npm i (solo para nuevos paquetes)
npm start
```

### React (Frontend)

- **Iniciar Aplicación React**
```
cd client
npm install (solo para nuevos paquetes)
npm run dev
```

### Express (Backend)

- **Iniciar Servidor Express**
```
npm install (solo para nuevos paquetes)
npm run dev
```

- **Variables de entorno - Backend**
> Crea un archivo .env dentro de la carpeta backend con el siguiente contenido:

```
HOST=localhost
DATABASE=db_tormenta
USER=root
PASSWORD=tupass
TOKEN_SECRET=tormenta_secreto
FRONTEND_URL=http://localhost:5173
```

- **Variables de entorno - Frontend**
> Crea un archivo .env dentro de la carpeta client con el siguiente contenido:
```
VITE_API_URL=http://localhost:4000/api
```