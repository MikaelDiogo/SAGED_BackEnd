import type { Request, Response } from "express";
import { DemandService } from "../services/DemandService.js";
import { TypeORMDemandRepository } from "../repositories/implementations/TypeORMDemandRepository.js";
import { ReportPDFService } from "../services/ReportPDFService.js";
import { AccessDeniedError } from "../errors/AccessDeniedError.js";
import type { AuthenticatedUser } from "../types/auth.js";

function requireAuthUser(req: Request): AuthenticatedUser {
  const user = req.user;
  if (!user?.id || !user.role) {
    throw new Error("Contexto de utilizador não identificado.");
  }
  return user;
}

export class DemandReportController {
  private readonly pdfService = new ReportPDFService();

  private demandService() {
    return new DemandService(new TypeORMDemandRepository());
  }

  async getReport(req: Request, res: Response) {
    try {
      const user = requireAuthUser(req);
      const { month, year, departmentId } = req.query;
      const report = await this.demandService().generateManagementReport(
        user,
        Number(month ?? new Date().getMonth() + 1),
        Number(year ?? new Date().getFullYear()),
        departmentId ? String(departmentId) : undefined,
      );
      return res.json(report);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao gerar relatório.";
      const status = error instanceof AccessDeniedError ? 403 : 400; // Usa a classe de erro
      return res.status(status).json({ error: message });
    }
  }

  async exportPDF(req: Request, res: Response) {
    try {
      const user = requireAuthUser(req);
      const { month, year, departmentId } = req.query;

      // Busca os dados consolidados do banco baseando-se no nível do usuário
      const report = await this.demandService().generateManagementReport(
        user,
        Number(month ?? new Date().getMonth() + 1),
        Number(year ?? new Date().getFullYear()),
        departmentId ? String(departmentId) : undefined,
      );

      // Gera o buffer de memória com o layout corrigido do jsPDF
      const pdfBuffer = await this.pdfService.generateMonthlyReport(report, {
        name: user.name ?? "Administrador",
        role: user.role,
        unit: report.scope,
      });

      // Cabeçalhos HTTP explícitos para forçar download binário no navegador
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio-saged-${month ?? "mes"}-${year ?? "ano"}.pdf`,
      );

      return res.send(pdfBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao exportar PDF.";
      const status = error instanceof AccessDeniedError ? 403 : 400; // Usa a classe de erro
      return res.status(status).json({ error: message });
    }
  }
}