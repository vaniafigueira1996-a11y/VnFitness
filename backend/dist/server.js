import { app } from './app.js';
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Servidor VnFitness rodando na porta ${PORT}`);
    console.log(`🌐 Login & Início:  http://localhost:${PORT}`);
    console.log(`📱 App do Aluno:   http://localhost:${PORT}/app`);
    console.log(`📊 Painel Admin:   http://localhost:${PORT}/admin`);
    console.log(`🔒 Admin Mestre:   fredsoncitty@gmail.com`);
    console.log(`=======================================================`);
});
