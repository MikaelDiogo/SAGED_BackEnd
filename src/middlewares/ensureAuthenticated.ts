import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "../types/auth.js";

interface TokenPayload {
  role: string;
  departmentId?: string;
  /** Legado (tokens antigos) */
  deptId?: string;
  name?: string;
  email?: string; 
  isSectorLeader?: boolean;
  tech_type_code?: string;
  sub: string;
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Busca o token no cookie
  const token = req.cookies?.token as string | undefined;

  if (!token) { // Se não houver token no cookie, retorna erro
    return res.status(401).json({ message: "Token não enviado ou inválido" });
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as TokenPayload;

    const departmentId = decoded.departmentId ?? decoded.deptId;

    // SOLUÇÃO: Criamos o objeto base atendendo estritamente as propriedades obrigatórias
    const user: AuthenticatedUser = {
      id: decoded.sub,
      name: decoded.name ?? "", 
      email: decoded.email ?? "", 
      role: decoded.role,
      isSectorLeader: decoded.isSectorLeader ?? false,
      // Usamos a sintaxe de curto-circuito com spread para que a propriedade
      // simplesmente não seja declarada se vier undefined (satisfez a regra exata)
      ...(decoded.tech_type_code ? { tech_type_code: decoded.tech_type_code } : {})
    };

    if (departmentId) {
      user.departmentId = departmentId;
    }

    req.user = user;

    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}