import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errors";

export interface AuthUser {
  id: number;
  username: string;
  role: "SECRETARIA" | "ALUNO";
  studentId?: number;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "NAO_AUTENTICADO", "Faça login para continuar."));
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? "dev-secret") as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "TOKEN_INVALIDO", "Sessão inválida ou expirada."));
  }
}

export function requireRole(role: "SECRETARIA" | "ALUNO") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return next(new AppError(403, "SEM_PERMISSAO", "Acesso negado."));
    next();
  };
}