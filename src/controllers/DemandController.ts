import type { Request, Response } from "express";
import { DemandService } from "../services/DemandService.js";
import { TypeORMDemandRepository } from "../repositories/implementations/TypeORMDemandRepository.js";

export class DemandController {
  private getService() {
    return new DemandService(new TypeORMDemandRepository());
  }

 async create(req: Request, res: Response) {
  try {
    const { title, description, asset_tag } = req.body;

    if (title && title.length > 200) {
      return res.status(400).json({ error: 'Título muito longo (máximo 200 caracteres).' });
    }
    if (description && description.length > 2000) {
      return res.status(400).json({ error: 'Descrição muito longa (máximo 2000 caracteres).' });
    }
    if (asset_tag && asset_tag.length > 50) {
      return res.status(400).json({ error: 'Patrimônio muito longo (máximo 50 caracteres).' });
    }

    // FIX DE SEGURANÇA: Nunca confiamos no senderId vindo do body. 
    // Sobrescrevemos com o ID do usuário autenticado extraído do token JWT.
    const demand = await this.getService().executeCreate({
      ...req.body,
      senderId: req.user!.id,
      user: req.user!,
    });

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
        user: user, // Passamos o objeto do usuário completo para o Service validar IDOR
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

      const page = parseInt(req.query.page as string) || 1; // Default para página 1
      const limit = parseInt(req.query.limit as string) || 10; // Default para 10 itens por página

      const demands = await this.getService().listForDashboard(user, page, limit);
      return res.json(demands);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao listar demandas.";
      return res.status(400).json({ error: message });
    }
  }

  async showHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!id) return res.status(400).json({ error: "ID da demanda é obrigatório." });
      if (!user) return res.status(401).json({ error: "Não autenticado." });

      const history = await this.getService().getDemandTimeline(String(id), user);
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