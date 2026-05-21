import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "../types/auth.js";

/**
 * Middleware para verificar se o usuário autenticado possui um dos papéis permitidos.
 * Deve ser usado APÓS o middleware `ensureAuthenticated`.
 * @param allowedRoles Array de strings com os papéis permitidos (ex: ["ADMIN_GERAL", "ADMIN_SETOR"]).
 */
export function ensureRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para esta ação." });
    }

    next();
  };
}