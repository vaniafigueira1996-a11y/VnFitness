import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Servir os arquivos estáticos do front-end no ambiente local
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Fallbacks para Single Page / Telas Principais no ambiente local
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
