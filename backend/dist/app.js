import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes/index.js';
dotenv.config();
export const app = express();
// Middlewares essenciais
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// Health Check disponível em /api/health e /health
app.get(['/api/health', '/health'], (req, res) => {
    res.status(200).json({
        status: 'online',
        app: 'VnFitness Backend API',
        timestamp: new Date().toISOString()
    });
});
// Rota informativa da API
app.get(['/api', '/api/info'], (req, res) => {
    res.status(200).json({
        status: 'online',
        app: 'VnFitness Backend API',
        version: '1.0.0',
        documentation: 'API REST do sistema VnFitness com Supabase e Google Gemini'
    });
});
// Rotas da API montadas em /api e como fallback na raiz (compatibilidade total Serverless Vercel)
app.use('/api', routes);
app.use('/', routes);
export default app;
