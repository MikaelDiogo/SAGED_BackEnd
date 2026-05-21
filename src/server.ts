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

// CORRIGIDO: Agora aceita as requisições vindas do seu React (Vite)
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));

app.use(express.json({ limit: '10kb' })); 

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Muitas requisições desta IP, tente novamente após 15 minutos.",
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use(apiLimiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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