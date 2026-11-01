import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes/index.js';

dotenv.config();

export const app = express();

// Middlewares essenciais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.options('*', cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check disponível em múltiplos endpoints
app.get(['/api/health', '/health', '/api/index/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'VnFitness Backend API',
    timestamp: new Date().toISOString()
  });
});

// Rota informativa da API
app.get(['/api', '/api/info', '/api/index'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'VnFitness Backend API',
    version: '1.0.0',
    documentation: 'API REST do sistema VnFitness com Supabase e Google Gemini'
  });
});

// Rotas da API montadas em múltiplos prefixos para suportar qualquer mecanismo de proxy da Vercel
app.use('/api', routes);
app.use('/api/index', routes);
app.use('/api/index.js', routes);
app.use('/', routes);

// Handler 404 customizado em JSON (nunca retorna HTML)
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint não encontrado: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

export default app;
