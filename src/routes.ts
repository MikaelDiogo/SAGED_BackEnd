import { Router } from "express";
import { UserController } from "./controllers/UserController.js";
import { DepartmentController } from "./controllers/DepartmentController.js";
import { rateLimit } from "express-rate-limit";
import { DemandController } from "./controllers/DemandController.js";
import { DemandReportController } from "./controllers/DemandReportController.js";
import { SessionController } from "./controllers/SessionController.js";
import { ensureAuthenticated } from "./middlewares/ensureAuthenticated.js";
import { ensureApiKey } from "./middlewares/ensureApiKey.js";
import { ensureRole } from "./middlewares/ensureRole.js";
import { SpecialtyController } from "./controllers/SpecialtyController.js";

const routes = Router();

const userController = new UserController();
const deptController = new DepartmentController();
const demandController = new DemandController();    
const demandReportController = new DemandReportController();
const sessionController = new SessionController();
const specialtyController = new SpecialtyController();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Muitas tentativas de login desta IP, tente novamente após 5 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rotas totalmente públicas
routes.post("/sessions", loginLimiter, (req, res) => sessionController.create(req, res));
routes.delete("/sessions", (req, res) => sessionController.logout(req, res));
routes.get("/demands/whatsapp/summary/:lid", ensureApiKey, (req, res) => demandController.getBotSummary(req, res));

// Barreira global de autenticação
routes.use(ensureAuthenticated);

routes.get("/sessions/me", (req, res) => sessionController.me(req, res));

// Apenas ADMIN_GERAL pode criar recursos estruturais
routes.post("/users", ensureRole(["ADMIN_GERAL"]), (req, res) => userController.create(req, res));
routes.post("/departments", ensureRole(["ADMIN_GERAL"]), (req, res) => deptController.create(req, res));
routes.post("/specialties", ensureRole(["ADMIN_GERAL"]), (req, res) => specialtyController.create(req, res));

// Rotas gerais de leitura e movimentação (Exigem apenas login)
routes.get("/departments", (req, res) => deptController.list(req, res));
routes.get("/specialties", (req, res) => specialtyController.list(req, res));
routes.get("/demands/reports/management", (req, res) => demandReportController.getReport(req, res));
routes.get("/demands/reports/export-pdf", (req, res) => demandReportController.exportPDF(req, res));
routes.post("/demands", (req, res) => demandController.create(req, res));
routes.get("/demands", (req, res) => demandController.index(req, res));
routes.patch("/demands/:id/status", (req, res) => demandController.updateStatus(req, res));
routes.get("/demands/:id/history", (req, res) => demandController.showHistory(req, res));

export { routes };