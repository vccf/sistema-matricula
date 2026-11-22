import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { AppError } from "../errors";

const router = Router();
const SECRET = process.env.JWT_SECRET ?? "dev-secret";

router.post("/login", async (req, res, next) => {
  try {
    const { username } = req.body ?? {};
    if (typeof username !== "string" || !username.trim())
      throw new AppError(400, "DADOS_INVALIDOS", "Informe o usuário.");

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      include: { student: true },
    });
    if (!user) throw new AppError(401, "CREDENCIAIS_INVALIDAS", "Usuário não encontrado.");

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role as "SECRETARIA" | "ALUNO",
      studentId: user.student?.id,
    };
    const token = jwt.sign(payload, SECRET, { expiresIn: "8h" });
    res.json({ token, user: payload });
  } catch (e) { next(e); }
});

export default router;