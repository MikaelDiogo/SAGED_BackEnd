import type { Request, Response } from "express";
import { DemandService } from "../services/DemandService.js";
import { TypeORMDemandRepository } from "../repositories/implementations/TypeORMDemandRepository.js";
import { ReportPDFService } from "../services/ReportPDFService.js";
import { AccessDeniedError } from "../errors/AccessDeniedError.js";
import type { AuthenticatedUser } from "../types/auth.js";

/**
 * Extrai e valida o contexto do usuário autenticado na requisição.
 * Garante falha rápida caso o middleware de autenticação tenha falhado ou omitido dados.
 */
function requireAuthUser(req: Request): AuthenticatedUser {
  const user = req.user as AuthenticatedUser | undefined;
  if (!user?.id || !user.role) {
    throw new AccessDeniedError("Contexto de utilizador não identificado ou token inválido.");
  }
  return user;
}

export class DemandReportController {
  private readonly pdfService = new ReportPDFService();

  /**
   * Instancia o serviço injetando o repositório TypeORM mapeado.
   * Isolamento mantido para reaproveitamento do ciclo de vida da requisição.
   */
  private demandService(): DemandService {
    return new DemandService(new TypeORMDemandRepository());
  }

  /**
   * Captura as métricas gerenciais filtradas por período e escopo setorial.
   * GET /demands/reports/management
   */
  async getReport(req: Request, res: Response): Promise<Response> {
    try {
      const user = requireAuthUser(req);
      const { month, year, departmentId } = req.query;

      // Sanitização estrita contra NaN ou inputs maliciosos na URL via parseInt defensivo
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const parsedMonth = month ? parseInt(month as string, 10) : currentMonth;
      const parsedYear = year ? parseInt(year as string, 10) : currentYear;

      // Validação rápida de range de calendário para poupar processamento do banco
      if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || isNaN(parsedYear)) {
        return res.status(400).json({ error: "Parâmetros de período inválidos fornecidos." });
      }

      const report = await this.demandService().generateManagementReport(
        user,
        parsedMonth,
        parsedYear,
        departmentId ? String(departmentId).trim() : undefined,
      );

      return res.status(200).json(report);
    } catch (error: unknown) {
      return this.handleError(res, error, "Erro ao gerar relatório.");
    }
  }

  /**
   * Exporta os dados gerenciais em formato binário PDF direto para fluxo do navegador.
   * GET /demands/reports/export-pdf
   */
  async exportPDF(req: Request, res: Response): Promise<Response | void> {
    try {
      const user = requireAuthUser(req);
      const { month, year, departmentId } = req.query;

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const parsedMonth = month ? parseInt(month as string, 10) : currentMonth;
      const parsedYear = year ? parseInt(year as string, 10) : currentYear;

      if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || isNaN(parsedYear)) {
        return res.status(400).json({ error: "Parâmetros de período inválidos para exportação." });
      }

      // 1. Agrega os indicadores operacionais validados pelas regras de visibilidade
      const report = await this.demandService().generateManagementReport(
        user,
        parsedMonth,
        parsedYear,
        departmentId ? String(departmentId).trim() : undefined,
      );

      // 2. Transforma a estrutura em buffer binário via jsPDF
      const pdfBuffer = await this.pdfService.generateMonthlyReport(report, {
        name: user.name ?? "Administrador",
        role: user.role,
        unit: report.scope,
      });

      const safeMonth = String(parsedMonth).padStart(2, "0");
      
      // 3. Define os cabeçalhos HTTP necessários para o download seguro de arquivos binários
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio-saged-${safeMonth}-${parsedYear}.pdf`,
      );

      // Envia o stream binário finalizado
      res.end(pdfBuffer);
    } catch (error: unknown) {
      return this.handleError(res, error, "Erro ao exportar PDF.");
    }
  }

  /**
   * Centralizador defensivo para tratamento e mapeamento de exceções operacionais.
   */
  private handleError(res: Response, error: unknown, defaultMessage: string): Response {
    const isErrorInstance = error instanceof Error;
    const message = isErrorInstance ? error.message : defaultMessage;
    
    // Abordagem sênior: Verifica o nome da construtora ou mensagem para mitigar perda de protótipo do TS
    const isAccessDenied = 
      error instanceof AccessDeniedError || 
      (isErrorInstance && error.name === "AccessDeniedError") ||
      message.includes("Acesso negado");

    const status = isAccessDenied ? 403 : 400;

    // Log interno detalhado para auditoria sem expor stacktrace sensível ao usuário final
    console.error(`[REPORT CONTROLLER ERROR] [HTTP ${status}]:`, error);

    return res.status(status).json({ error: message });
  }
}