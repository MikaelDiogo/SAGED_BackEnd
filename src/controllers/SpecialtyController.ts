import type { Request, Response } from "express";
import { SpecialtyService } from "../services/SpecialtyService.js";

export class SpecialtyController {
  private specialtyService = new SpecialtyService();

  // GET /specialties
  async list(req: Request, res: Response) {
    try {
      const specialties = await this.specialtyService.listAll();
      return res.json(specialties);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar especialidades." });
    }
  }

  // POST /specialties
  async create(req: Request, res: Response) {
    try {
      const { code, name } = req.body;
      
      const specialty = await this.specialtyService.createSpecialty(code, name);
      return res.status(201).json(specialty);
    } catch (error: any) {
      // Se for o erro de duplicidade lançado pelo Service
      if (error.message === "Especialidade já cadastrada.") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro ao criar especialidade." });
    }
  }
}