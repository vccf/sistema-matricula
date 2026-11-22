import { Router, Request } from "express";
import { prisma } from "../db";
import { AppError } from "../errors";
import { requireRole } from "../auth";
import { calcularProgresso } from "../services/progresso";
import { matricular, cancelar } from "../services/matricula";

const router = Router();
router.use(requireRole("ALUNO"));

function sid(req: Request): number {
  const id = req.user?.studentId;
  if (!id) throw new AppError(403, "SEM_ALUNO", "Usuário não está associado a um aluno.");
  return id;
}

router.get("/ofertas", async (req, res, next) => {
  try {
    const studentId = sid(req);
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "10"), 10) || 10));

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { course: { include: { curriculum: true } }, history: { where: { status: "APROVADA" } } },
    });
    if (!student) throw new AppError(404, "ALUNO_NAO_ENCONTRADO", "Aluno não encontrado.");

    const curriculum = new Map(student.course.curriculum.map((c) => [c.disciplineId, c.type] as const));
    const aprovadas = new Set(student.history.map((h) => h.disciplineId));
    const ativas = await prisma.enrollment.findMany({
      where: { studentId, status: "ATIVA" },
      select: { classGroup: { select: { disciplineId: true } } },
    });
    const matriculadaEm = new Set(ativas.map((a) => a.classGroup.disciplineId));

    const where = q
      ? {
          OR: [
            { discipline: { code: { contains: q } } },
            { discipline: { name: { contains: q } } },
            { professor: { name: { contains: q } } },
          ],
        }
      : {};

    const [total, turmas] = await Promise.all([
      prisma.classGroup.count({ where }),
      prisma.classGroup.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          discipline: { include: { prerequisites: { include: { requires: true } } } },
          professor: true,
          enrollments: { where: { status: "ATIVA" } },
        },
      }),
    ]);

    res.json({
      page, pageSize, total,
      itens: turmas.map((t) => {
        const tipo = curriculum.get(t.disciplineId);
        const grupo = tipo === "OBRIGATORIA" ? "OBRIGATORIA" : tipo === "ELETIVA_PERFIL" ? "ELETIVA_PERFIL" : "ELETIVA_LIVRE";
        return {
          id: t.id,
          disciplina: { id: t.discipline.id, codigo: t.discipline.code, nome: t.discipline.name, ch: t.discipline.ch },
          professor: { id: t.professor.id, nome: t.professor.name },
          vagas: t.vagas,
          ocupadas: t.enrollments.length,
          disponiveis: Math.max(0, t.vagas - t.enrollments.length),
          grupo,
          preRequisitos: t.discipline.prerequisites.map((p) => ({ codigo: p.requires.code, nome: p.requires.name })),
          jaAprovado: aprovadas.has(t.disciplineId),
          jaMatriculado: matriculadaEm.has(t.disciplineId),
        };
      }),
    });
  } catch (e) { next(e); }
});

router.get("/matriculas", async (req, res, next) => {
  try {
    const studentId = sid(req);
    const enrs = await prisma.enrollment.findMany({
      where: { studentId, status: "ATIVA" },
      include: { classGroup: { include: { discipline: true, professor: true } } },
      orderBy: { id: "asc" },
    });
    res.json(enrs.map((e) => ({
      id: e.id,
      turmaId: e.classGroupId,
      disciplina: { codigo: e.classGroup.discipline.code, nome: e.classGroup.discipline.name, ch: e.classGroup.discipline.ch },
      professor: e.classGroup.professor.name,
    })));
  } catch (e) { next(e); }
});

router.post("/matriculas", async (req, res, next) => {
  try {
    const studentId = sid(req);
    const { classGroupId } = req.body ?? {};
    if (typeof classGroupId !== "number")
      throw new AppError(400, "DADOS_INVALIDOS", "classGroupId é obrigatório.");
    const enr = await matricular(studentId, classGroupId);
    res.status(201).json(enr);
  } catch (e) { next(e); }
});

router.delete("/matriculas/:id", async (req, res, next) => {
  try {
    const studentId = sid(req);
    const id = parseInt(req.params.id, 10);
    if (!id) throw new AppError(400, "ID_INVALIDO", "ID inválido.");
    await cancelar(studentId, id);
    res.status(204).end();
  } catch (e) { next(e); }
});

router.get("/progresso", async (req, res, next) => {
  try {
    const studentId = sid(req);
    res.json(await calcularProgresso(studentId));
  } catch (e) { next(e); }
});

export default router;