import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { routes } from './routes.js';
import { AppDataSource } from './database/data-source.js';

// Importando o arquivo de documentação com a nova sintaxe 'with'
import swaggerDocument from './swagger.json' with { type: 'json' };

const app = express();

// Middlewares principais
app.use(cors());
app.use(express.json());

// Rota do Swagger - Disponível em http://localhost:3333/docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Suas rotas da API
app.use(routes);

const PORT = 3333;

// Inicializa o Banco antes de subir o servidor
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