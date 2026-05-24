import type { Request, Response } from "express";
import { UserService } from "../services/UserService.js";
import { UserRole } from "../constants/user-roles.js";

export class UserController {
  async create(req: Request, res: Response) {
    const { name, email, password, tech_type_code, departmentId, role, is_sector_leader } = req.body;

    const userService = new UserService();

    try {
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          error: "Campos obrigatórios: name, email, password e role.",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Formato de e-mail inválido.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Senha deve ter no minimo 8 caracteres.",
        });
      }

      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({
          error: "Senha deve conter pelo menos uma letra e um numero.",
        });
      }

      if (!Object.values(UserRole).includes(role as any)) {
        return res.status(400).json({
          error: `Role inválida. Valores aceitos: ${Object.values(UserRole).join(", ")}.`,
        });
      }

      if (role !== UserRole.ADMIN_GERAL && !departmentId) {
        return res.status(400).json({
          error: "departmentId é obrigatório para este papel.",
        });
      }

      const user = await userService.create({
        name,
        email,
        password,
        role,
        tech_type_code,
        departmentId: departmentId ?? null,
        is_sector_leader,
      });

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tech_type_code: user.tech_type_code,
        is_sector_leader: user.is_sector_leader,
        departmentId: user.departmentId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
      return res.status(400).json({ error: message });
    }
  }
}
