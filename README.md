# PRESTA+ | Sistema de gestión de préstamos prendarios

PRESTA+ es un sistema web desarrollado para administrar los procesos de una casa de préstamos prendarios. A través de la aplicación, los clientes pueden registrar artículos como garantía y realizar solicitudes de préstamo. Por otra parte, el personal encargado puede revisar las solicitudes, realizar la tasación de los artículos, aprobar o rechazar operaciones y gestionar los préstamos.

El sistema también permite registrar pagos, renovaciones y rescates, además de consultar las garantías que se encuentran en custodia y llevar un control de los préstamos próximos a vencer o vencidos.

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Frontend | React 18, Vite y Tailwind CSS 3 |
| Backend | Node.js 18+ y Express 4 |
| Base de datos | MongoDB y Mongoose 8 |
| Autenticación | JWT (HS256) |
| Cifrado de contraseñas | bcryptjs |
| Seguridad | RBAC, AES-256-GCM, Helmet y rate limiting |
| Documentación API | Swagger UI y OpenAPI 3.0 |
| Pruebas | node:test |
| Pruebas de API | Postman |

## Funcionalidades del sistema

El sistema contempla los requerimientos funcionales RF-001 al RF-014 y organiza las operaciones según el tipo de usuario.

### Gestión de cuentas
- Registro de usuarios con verificación mediante código OTP enviado al correo.
- Inicio de sesión.
- Recuperación de contraseña.
- Consulta y edición del perfil.
- Cambio de contraseña.

### Funciones del cliente
- Registro de artículos que se utilizarán como garantía.
- Carga de fotografías de los artículos.
- Preevaluación del valor de la garantía.
- Registro de solicitudes de préstamo.
- Consulta del estado de las solicitudes.
- Acceso al contrato digital.
- Consulta del historial de préstamos y comprobantes.
- Recepción de notificaciones.

### Funciones del empleado
- Revisión de solicitudes recibidas.
- Evaluación y tasación de las garantías.
- Aprobación o rechazo de solicitudes con su respectivo motivo.
- Generación de contratos digitales.
- Registro de abonos y pagos de intereses.
- Gestión de renovaciones y rescates.
- Consulta de artículos en custodia.
- Seguimiento de préstamos vencidos y próximos a vencer.
- Consulta del dashboard de operaciones.

### Funciones del administrador
- Registro y administración de las cuentas del personal.
- Alta y baja de empleados.

## Estructura del repositorio

El proyecto está organizado en dos módulos principales, el frontend y el backend, además de una carpeta destinada a la documentación y los archivos necesarios para ejecutar el sistema.

```text
presta-plus/
│
├── client/                  # Aplicación frontend
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── utils/
│
├── server/                  # API y lógica del sistema
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── docs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── scripts/
│   └── tests/
│
├── docs/                    # Documentación del proyecto
│   ├── postman/
│   ├── openapi.json
│   ├── diagramas
│   └── informe técnico
│
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Instalación y configuración

### Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js 18.18 o superior, preferentemente versión 20 LTS.
- npm.
- MongoDB local, Docker o una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas).
- Git.

### 1. Clonar el repositorio

Desde una terminal, ejecutar:

```bash
git clone https://github.com/FF3456/presta-plus.git
cd presta-plus
```

Instalar las dependencias de ambos módulos:

```bash
npm run install:all
```

### 2. Configurar la base de datos

Para utilizar MongoDB local mediante Docker, ejecutar:

```bash
docker compose up -d
```

El servicio utilizará el puerto `27017`.

Si se utiliza MongoDB Atlas, se debe copiar la URI de conexión del clúster y colocarla en el archivo de configuración del servidor.

### 3. Configurar las variables de entorno

Crear los archivos `.env` a partir de los ejemplos incluidos:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

En el archivo `server/.env` se deben revisar los valores de conexión y las claves utilizadas por el sistema.

Para generar una clave JWT:

```bash
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(48).toString('hex'))"
```

Para generar la clave de cifrado:

```bash
node -e "console.log('ENCRYPTION_KEY='+require('crypto').randomBytes(32).toString('hex'))"
```

La conexión predeterminada de MongoDB es:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/prestamas
```

### 4. Cargar usuarios de prueba

El proyecto incluye un script para generar datos de demostración. Para ejecutarlo:

```bash
npm run seed
```

Se pueden utilizar las siguientes cuentas durante las pruebas:

| Tipo de usuario | Correo | Contraseña |
|---|---|---|
| Administrador | admin@prestamas.test | Admin |
| Empleado | empleado@prestamas.test | Empleado |
| Cliente | cliente@prestamas.test | Cliente |

Estas credenciales son para el entorno de desarrollo y no deben utilizarse en una instalación de producción.

### 5. Iniciar la aplicación

Para ejecutar el sistema se necesitan dos terminales abiertas en la carpeta principal del repositorio.

**Backend**

```bash
npm run dev:server
```

La API se ejecuta en:

`http://localhost:4000`

**Frontend**

```bash
npm run dev:client
```

La aplicación web se ejecuta en:

`http://localhost:5173`

La documentación de los servicios está disponible mediante Swagger:

`http://localhost:4000/api-docs`

Cuando no existe una configuración SMTP, el código OTP se muestra en la consola del servidor. Durante el desarrollo también puede visualizarse en pantalla si se encuentra habilitada la variable `DEV_EXPOSE_CODES=true`.

## Pruebas

Para ejecutar las pruebas automatizadas se utiliza:

```bash
npm test
```

Actualmente, el proyecto incluye 23 pruebas relacionadas con:

- Cálculos y reglas de los préstamos.
- Control de acceso según los roles.
- Validación de datos.
- Cifrado AES-256-GCM.
- Estructura de la documentación OpenAPI.

También se pueden realizar pruebas manuales utilizando Swagger UI o Postman. La colección se encuentra en `docs/postman/`.

## Preparación para producción

Para generar la versión compilada del frontend:

```bash
npm run build
```

Los archivos resultantes se guardan en `client/dist`.

Antes de desplegar el sistema se deben configurar las variables correspondientes al entorno de producción:

- `NODE_ENV=production`
- `DEV_EXPOSE_CODES=false`
- `CLIENT_URL` con la dirección del frontend.
- `MONGODB_URI` con la conexión a la base de datos de producción.
- Claves JWT y de cifrado diferentes a las utilizadas durante el desarrollo.

También se debe configurar `VITE_API_URL` en el frontend con la dirección de la API, por ejemplo:

```env
VITE_API_URL=https://su-api/api
```

La comunicación con el servidor debe realizarse mediante HTTPS.

## API REST

El backend dispone de una API REST para conectar las operaciones del frontend con la base de datos.

La documentación está disponible en las siguientes direcciones:

| Recurso | Dirección |
|---|---|
| Swagger UI | `/api-docs` |
| OpenAPI JSON | `/api-docs.json` |
| Archivo OpenAPI | `docs/openapi.json` |

Para utilizar los endpoints protegidos primero se debe iniciar sesión mediante:

```http
POST /api/auth/login
```

La respuesta proporciona un token JWT que debe enviarse en las siguientes solicitudes mediante la cabecera:

```http
Authorization: Bearer <token>
```

### Principales endpoints

| Recurso | Operaciones disponibles |
|---|---|
| Autenticación | Registro, verificación OTP, login y recuperación de contraseña |
| Usuarios | Consulta y actualización de perfil, cambio de contraseña y administración |
| Garantías | Registro, preevaluación, consulta, actualización y eliminación |
| Solicitudes | Registro, consulta, tasación, aprobación y rechazo |
| Préstamos | Consulta, cotización, contratos, pagos y custodia |
| Pagos | Registro y consulta de pagos |
| Notificaciones | Consulta de notificaciones |
| Dashboard | Resumen de operaciones |
| Health | Comprobación del estado de la API |

Para conocer los parámetros, métodos HTTP y respuestas de cada endpoint se puede consultar la documentación de Swagger.

## Seguridad

Durante el desarrollo se incorporaron mecanismos para proteger las cuentas, los datos y las operaciones realizadas dentro del sistema.

Entre ellos se encuentran:

- Uso de bcryptjs para almacenar las contraseñas mediante hashes.
- Autenticación con JWT y expiración de 60 minutos.
- Control de permisos mediante roles (cliente, empleado y administrador).
- Verificación de acceso a los recursos según el usuario autenticado.
- Cifrado de documentos de identidad mediante AES-256-GCM.
- Validación de los datos recibidos para evitar asignaciones de campos no permitidos e inyecciones de operadores NoSQL.
- Uso de Helmet para configurar cabeceras de seguridad.
- Restricción de orígenes mediante CORS.
- Limitación de solicitudes, especialmente en los endpoints de login y OTP.
- Validación del tipo y tamaño de las imágenes cargadas.
- Exclusión de archivos `.env` y claves privadas del repositorio.

## Integrantes del proyecto

- Fidel Jairo Flores Arratia
- Alvaro Felix Condori Cerda
- Yamil Pedro Ramos Huanca
- Mijael Emerson Vega Orellana
