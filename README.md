# PRESTA+ · Plataforma inteligente de préstamos prendarios

Sistema web **fullstack** (React + Express + MongoDB) para gestionar préstamos prendarios: el cliente registra su garantía y solicita un préstamo; el personal tasa, aprueba, genera el contrato digital, registra pagos/renovaciones/rescates y controla la custodia y los vencimientos.

> **Proyecto Integrador · Tecnologías en Internet — Segunda Entrega (Producto implementado y repositorio GitHub)**
> Universidad Adventista de Bolivia · Ingeniería de Sistemas · Docente: Ing. Victor Hugo Sarzuri Flores

| | |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS 3 (tokens del sistema de diseño de Figma) |
| **Backend** | Node.js 18+ · Express 4 · API REST |
| **Base de datos** | MongoDB (Atlas o local) con Mongoose 8 |
| **Seguridad** | JWT (HS256, 60 min) · bcryptjs (salt ≥ 10) · RBAC · AES-256-GCM · Helmet · rate limiting · validación por lista blanca |
| **Documentación** | Swagger UI / OpenAPI 3.0 en `/api-docs` · colección Postman · informe técnico en `docs/` |

## Funcionalidades (RF-001 … RF-014)

- **Cuentas:** registro con OTP por correo, login, recuperación de contraseña, perfil y cambio de contraseña.
- **Cliente:** registro de garantía con fotos, **pre-evaluación** instantánea, solicitud de préstamo, seguimiento de estado, contrato digital, historial y comprobantes, notificaciones.
- **Empleado:** evaluación y **tasación**, aprobación/rechazo con motivo, **contrato digital**, registro de abonos, pago de intereses, renovación y **rescate**, garantías en custodia, vencidos y por vencer, dashboard.
- **Administrador:** alta/baja de personal.

## Estructura del repositorio

```
presta-plus/
├── client/              # SPA React (Vite + Tailwind)
│   └── src/ (api, components, context, pages, utils)
├── server/              # API Node.js / Express
│   ├── src/ (config, constants, controllers, docs, middlewares, models, routes, services, utils)
│   ├── scripts/         # seed.js, export-docs.js
│   └── tests/           # pruebas automatizadas (node:test)
├── docs/                # Informe técnico, diagramas (C4, secuencia JWT), OpenAPI y Postman
├── docker-compose.yml   # MongoDB local opcional
├── .env.example         # (+ server/.env.example y client/.env.example)
└── .gitignore
```

## Manual de ejecución

### Requisitos previos
- Node.js **18.18+** (recomendado 20 LTS) y npm
- MongoDB local (o Docker) **o** un clúster gratuito de [MongoDB Atlas](https://www.mongodb.com/atlas)
- Git

### 1. Clonar e instalar
```bash
git clone https://github.com/<USUARIO>/presta-plus.git
cd presta-plus
npm run install:all          # instala server/ y client/
```

### 2. Base de datos
```bash
docker compose up -d         # MongoDB 7 en localhost:27017   (o use su URI de Atlas)
```

### 3. Variables de entorno
```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```
Edite `server/.env` y genere claves propias:
```bash
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY='+require('crypto').randomBytes(32).toString('hex'))"
```
(`MONGODB_URI` ya apunta a `mongodb://127.0.0.1:27017/prestamas`.)

### 4. Datos de demostración (opcional)
```bash
npm run seed
```
| Rol | Correo | Contraseña (solo desarrollo) |
|---|---|---|
| Administrador | `admin@prestamas.test` | `Admin#2026` |
| Empleado | `empleado@prestamas.test` | `Empleado#2026` |
| Cliente | `cliente@prestamas.test` | `Cliente#2026` |

### 5. Ejecutar
```bash
npm run dev:server           # API  → http://localhost:4000   (Swagger: /api-docs)
npm run dev:client           # SPA  → http://localhost:5173
```
Sin SMTP configurado, el **código OTP** se imprime en la consola del servidor y (con `DEV_EXPOSE_CODES=true`) se muestra en pantalla.

### 6. Pruebas
```bash
npm test                     # 23 pruebas: reglas de préstamos, RBAC, validación, AES-256-GCM, OpenAPI
```
Pruebas funcionales con Swagger UI o Postman: ver `docs/postman/` y la sección 8 del informe.

### 7. Producción
```bash
npm run build                # genera client/dist
```
Configure en el servidor: `NODE_ENV=production`, `DEV_EXPOSE_CODES=false`, `CLIENT_URL=https://su-frontend`, `MONGODB_URI` de Atlas y claves nuevas. Sirva la API detrás de HTTPS (TLS 1.3 en el proveedor/proxy). En el frontend defina `VITE_API_URL=https://su-api/api`.

## API REST

Documentación interactiva: **`GET /api-docs`** (OpenAPI en `/api-docs.json` y `docs/openapi.json`). Autenticación: `POST /api/auth/login` → usar `Authorization: Bearer <token>`.

| Recurso | Endpoints principales |
|---|---|
| Auth | `POST /auth/register · /verify-otp · /login · /forgot-password · /reset-password`, `GET /auth/me` |
| Usuarios | `PUT /users/me`, `PATCH /users/me/password`, `GET/POST /users` *(admin)* |
| Garantías | `POST /collaterals/pre-evaluation`, `POST/GET /collaterals`, `GET/PUT/DELETE /collaterals/:id` |
| Solicitudes | `POST/GET /loan-requests`, `PATCH /loan-requests/:id/appraisal · /approve · /reject` |
| Préstamos | `GET /loans`, `GET /loans/custody`, `GET /loans/:id · /quote · /contract`, `POST /loans/:id/payments` |
| Pagos | `GET /payments`, `GET /payments/:id` |
| Otros | `GET /notifications`, `GET /dashboard/summary`, `GET /health` |

## Seguridad

Contraseñas con **bcrypt** (salt ≥ 10) · **JWT** firmado con expiración de 60 min · **RBAC** en middleware (`cliente`, `empleado`, `admin`) y verificación de propiedad del recurso · documento de identidad cifrado con **AES-256-GCM** · validación por lista blanca (anti mass-assignment e inyección de operadores NoSQL) · Helmet, CORS restringido y rate limiting (más estricto en login/OTP) · subida de imágenes con tipo/tamaño controlado y nombres aleatorios · **ningún secreto en el repositorio** (`.env` ignorado).

## Equipo

Fidel Jairo Flores Arratia · Alvaro Felix Condori Cerda · Yamil Pedro Ramos Huanca · Mijael Emerson Vega Orellana
