import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { routes } from './routes/index.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '../../frontend');
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
// Rotas da API montadas em múltiplos prefixos para suportar qualquer proxy ou rewrite
app.use('/api', routes);
app.use('/api/index', routes);
app.use('/api/index.js', routes);
// Servir arquivos estáticos do frontend (CSS, JS, Imagens)
app.use(express.static(frontendPath));
// Rotas amigáveis para as telas do sistema
app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});
app.get('/app', (req, res) => {
    res.sendFile(path.join(frontendPath, 'app.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
// Handler 404 em JSON específico para chamadas de API inválidas
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: `Endpoint não encontrado: ${req.method} ${req.originalUrl || req.url}`,
        status: 404
    });
});
// Fallback para SPA (qualquer rota desconhecida abre a tela inicial)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
export default app;
