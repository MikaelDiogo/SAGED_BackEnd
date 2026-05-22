import type { Request, Response } from "express";
import { AppDataSource } from "../database/data-source.js";
import { User } from "../entities/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../constants/user-roles.js";

export class SessionController {
  async create(req: Request, res: Response) {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository
        .createQueryBuilder("user")
        .addSelect("user.password")
        .where("user.email = :email", { email })
        .getOne();

      if (!user) {
        return res.status(401).json({ message: "E-mail ou senha inválidos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "E-mail ou senha inválidos" });
      }

      const secret = process.env.JWT_SECRET as string;

      const effectiveRole = user.role ?? UserRole.TECNICO;

      const token = jwt.sign(
        {
          role: effectiveRole,
          name: user.name,
          isSectorLeader: user.is_sector_leader ?? false,
          // CORREÇÃO CRÍTICA: Insere as propriedades opcionais apenas se existirem de fato,
          // evitando passar 'undefined' devido ao exatOptionalPropertyTypes do tsconfig.json
          ...(user.departmentId ? { departmentId: user.departmentId } : {}),
          ...(user.tech_type_code ? { tech_type_code: user.tech_type_code } : {}),
        },
        secret,
        {
          subject: user.id,
          expiresIn: "1d",
        },
      );

      // Define a data de expiração do cookie (1 dia a partir de agora)
      const oneDay = 24 * 60 * 60 * 1000; // milissegundos
      const expirationDate = new Date(Date.now() + oneDay);

      res.cookie('token', token, {
        httpOnly: true, // Impede acesso via JavaScript no navegador
        secure: process.env.NODE_ENV === 'production', // Envia apenas em HTTPS em produção
        sameSite: 'lax', // Proteção contra CSRF
        expires: expirationDate,
      });
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: effectiveRole,
          tech_type_code: user.tech_type_code,
          is_sector_leader: user.is_sector_leader ?? false,
          departmentId: user.departmentId,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
}