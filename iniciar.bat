@echo off
title VnFitness - Servidor Backend & Frontend
echo ========================================================
echo         INICIANDO SISTEMA VNFITNESS COM IA
echo ========================================================
echo.
cd backend
if not exist node_modules (
    echo Instalando dependencias do backend...
    npm install
)

echo Iniciando servidor Node.js + TypeScript...
echo.
echo URL de Login:   http://localhost:3333/index.html
echo URL App Aluno:  http://localhost:3333/app.html
echo URL Admin:      http://localhost:3333/admin.html
echo.
echo Pressione Ctrl+C para encerrar o servidor.
echo ========================================================
npm run dev

