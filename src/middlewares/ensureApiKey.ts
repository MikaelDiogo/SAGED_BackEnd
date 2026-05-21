import type { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar a chave de API em endpoints de integração.
 */
export function ensureApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.WHATSAPP_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Acesso negado: API Key inválida ou ausente." });
  }

  next();
}