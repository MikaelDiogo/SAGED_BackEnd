import type { Request, Response } from "express";
import { DemandService } from "../services/DemandService.js";
import { TypeORMDemandRepository } from "../repositories/implementations/TypeORMDemandRepository.js";

export class DemandController {
  private getService() {
    return new DemandService(new TypeORMDemandRepository());
  }

  async create(req: Request, res: Response) {
    try {
      const demand = await this.getService().executeCreate(req.body);
      return res.status(201).json(demand);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar demanda.";
      return res.status(400).json({ error: message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user?.id) {
        return res.status(401).json({ error: "Não autenticado." });
      }
      const result = await this.getService().updateTechnicalStatus({
        demandId: String(id),
        technicianId: user.id,
        status: req.body.status,
        description: req.body.description,
        asset_tag: req.body.asset_tag,
      });
      return res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar status.";
      return res.status(400).json({ error: message });
    }
  }

  async index(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user?.id || !user.role) {
        return res.status(401).json({ error: "Contexto de utilizador não identificado." });
      }

      const demands = await this.getService().listForDashboard(user);
      return res.json(demands);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao listar demandas.";
      return res.status(400).json({ error: message });
    }
  }

  async showHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: "ID da demanda é obrigatório." });
      const history = await this.getService().getDemandTimeline(String(id));
      return res.json(history);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao buscar histórico.";
      return res.status(400).json({ error: message });
    }
  }

  async getBotSummary(req: Request, res: Response) {
    try {
      const { lid } = req.params;
      if (!lid) return res.status(400).json({ error: "LID obrigatório." });
      const summaryText = await this.getService().getTechnicianSummaryByLid(String(lid));
      return res.json({ message: summaryText });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao gerar resumo.";
      return res.status(400).json({ error: message });
    }
  }
}