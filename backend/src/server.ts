import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { routes } from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir os arquivos estáticos do front-end
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Rotas da API
app.use('/api', routes);

// Rota de Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'VnFitness Backend API',
    timestamp: new Date().toISOString()
  });
});

// Fallbacks para Single Page / Telas Principais
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendPath, 'app.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor VnFitness rodando na porta ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📱 App Aluno: http://localhost:${PORT}/app`);
  console.log(`📊 Painel Admin: http://localhost:${PORT}/admin`);
  console.log(`🔒 Admin Credencial: fredsoncitty@gmail.com`);
  console.log(`=======================================================`);
});

