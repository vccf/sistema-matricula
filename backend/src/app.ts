// app.ts
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import alunoRouter from "./routes/aluno";
import secretariaRouter from "./routes/secretaria";
import { AppError } from "./errors";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/aluno", alunoRouter);
  app.use("/api/secretaria", secretariaRouter);

  app.use((_req: Request, _res: Response, next: NextFunction) =>
    next(new AppError(404, "NAO_ENCONTRADO", "Rota não encontrada.")),
  );

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError)
      return res.status(err.status).json({ code: err.code, message: err.message });
    console.error(err);
    res.status(500).json({ code: "ERRO_INTERNO", message: "Erro interno." });
  });
  return app;
}