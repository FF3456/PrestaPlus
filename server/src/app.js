import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapi } from './docs/openapi.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiters.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // detrás de proxy/reverse proxy (Render, Railway, Nginx) para rate limit por IP real

// RF-004 · Swagger UI. Se monta antes de Helmet porque necesita scripts inline propios.
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'PRESTA+ API · Swagger UI',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  }),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, cb) {
      // Permite herramientas sin Origin (Postman, curl) y los orígenes configurados
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(new Error('Origen no permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Fotografías de garantías (nombres aleatorios no adivinables)
app.use('/uploads', express.static(env.uploadDir, { maxAge: '1d', index: false }));

app.get('/', (req, res) => res.json({ name: 'PRESTA+ API', version: '1.0.0', docs: '/api-docs', health: '/api/health' }));
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
