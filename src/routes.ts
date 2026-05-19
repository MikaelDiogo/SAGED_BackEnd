import { Router } from "express";
import { UserController } from "./controllers/UserController.js";
import { DepartmentController } from "./controllers/DepartmentController.js";
import { DemandController } from "./controllers/DemandController.js";
import { DemandReportController } from "./controllers/DemandReportController.js";
import { SessionController } from "./controllers/SessionController.js";
import { ensureAuthenticated } from "./middlewares/ensureAuthenticated.js";

const routes = Router();

const userController = new UserController();
const deptController = new DepartmentController();
const demandController = new DemandController();
const demandReportController = new DemandReportController();
const sessionController = new SessionController();

routes.post("/sessions", (req, res) => sessionController.create(req, res));

routes.post("/users", (req, res) => userController.create(req, res));

routes.post("/departments", (req, res) => deptController.create(req, res));

routes.get("/demands/whatsapp/summary/:lid", (req, res) => demandController.getBotSummary(req, res));

routes.use(ensureAuthenticated);

routes.get("/departments", (req, res) => deptController.list(req, res));

routes.get("/demands/reports/management", (req, res) => demandReportController.getReport(req, res));
routes.get("/demands/reports/export-pdf", (req, res) => demandReportController.exportPDF(req, res));

routes.post("/demands", (req, res) => demandController.create(req, res));
routes.get("/demands", (req, res) => demandController.index(req, res));
routes.patch("/demands/:id/status", (req, res) => demandController.updateStatus(req, res));
routes.get("/demands/:id/history", (req, res) => demandController.showHistory(req, res));

export { routes };
