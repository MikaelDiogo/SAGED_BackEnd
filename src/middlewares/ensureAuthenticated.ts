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
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não enviado" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ message: "Erro no formato do token" });
  }

  const token = parts[1] as string;

  try {
    const secret: string = process.env.JWT_SECRET || "SUA_CHAVE_SECRETA_PADRAO";

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