import type { Request, Response } from 'express';
import { DepartmentService } from '../services/DepartmentService.js';

export class DepartmentController {
  async create(req: Request, res: Response) {
    const { name, code } = req.body;
    const service = new DepartmentService();

    try {
      if (!name || !code) {
        return res.status(400).json({ error: "Nome e Código são obrigatórios." });
      }

      const department = await service.create(name, code);
      return res.status(201).json(department);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    const service = new DepartmentService();
    try {
      const departments = await service.list();
      return res.json(departments);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}