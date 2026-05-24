import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv'; 
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { routes } from './routes.js';
import cookieParser from 'cookie-parser'; 
import { AppDataSource } from './database/data-source.js';
import swaggerDocument from './swagger.json' with { type: 'json' };

// ==========================================
// TRATAMENTO DE ERROS GLOBAIS DO PROCESSO
// Evita que o PowerShell quebre com exit code: 2
// ==========================================
process.on('uncaughtException', (error) => {
  console.error('❌ ERRO CRÍTICO NÃO CAPTURADO NO NODE:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMISE REJEITADA SEM TRATAMENTO EM:', promise, 'Motivo:', reason);
});

dotenv.config(); 

const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL", "WHATSAPP_API_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERRO FATAL: A variável de ambiente ${envVar} não foi definida.`);
    process.exit(1);
  }
}

const app = express();

app.use(cookieParser()); 
app.use(helmet()); 

// Configuração do CORS para aceitar o Vite do React
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));

// FIX R-04: Redução do limite de payload para evitar ataques de DoS por body gigante.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// FIX R-05: Ajuste do Rate Limit global para ser mais restritivo (100 requisições / 5 min).
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // Janela reduzida para 5 minutos
  max: 100,
  message: { error: 'Muitas requisicoes vindas deste IP, tente novamente mais tarde.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Documentação do Swagger aberta fora do limitador de requisições
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Aplica o limitador de requisições apenas nas rotas da API/SAGE
app.use(apiLimiter);
app.use(routes);

const PORT = 3333; 

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Banco de dados conectado com sucesso!");
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Documentação disponível em http://localhost:${PORT}/docs`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar no banco:", error);
  });