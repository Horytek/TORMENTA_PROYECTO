# PROYECTO TORMENTA:

## Comandos principales:

- **Iniciar Aplicación/Servidor**
```
cd backend
npm i
npm start
```

### React (Frontend)

- **Iniciar Aplicación React**
```
cd client
npm install
npm run dev
```

### Express (Backend)

- **Iniciar Servidor Express**
```
cd backend
npm install
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