import { Router } from "express";
import { prisma } from "../db";
import { AppError } from "../errors";
import { requireRole } from "../auth";

const router = Router();
router.use(requireRole("SECRETARIA"));

function validateCH(ch: unknown): asserts ch is number {
  if (typeof ch !== "number" || ch < 15 || ch > 120 || ch % 15 !== 0)
    throw new AppError(400, "CH_INVALIDA", "A carga horária deve ser múltiplo de 15 entre 15h e 120h.");
}

/* -------- Disciplinas -------- */
router.get("/disciplinas", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? "10"), 10) || 10));
    const where = q ? { OR: [{ code: { contains: q } }, { name: { contains: q } }] } : {};
    const [total, itens] = await Promise.all([
      prisma.discipline.count({ where }),
      prisma.discipline.findMany({
        where, orderBy: { id: "asc" }, skip: (page - 1) * pageSize, take: pageSize,
        include: { prerequisites: { include: { requires: true } } },
      }),
    ]);
    res.json({ page, pageSize, total, itens });
  } catch (e) { next(e); }
});

router.post("/disciplinas", async (req, res, next) => {
  try {
    const { code, name, ch, prerequisiteIds } = req.body ?? {};
    if (typeof code !== "string" || !code.trim())
      throw new AppError(400, "DADOS_INVALIDOS", "Código é obrigatório.");
    if (typeof name !== "string" || !name.trim())
      throw new AppError(400, "DADOS_INVALIDOS", "Nome é obrigatório.");
    validateCH(ch);
    if (await prisma.discipline.findUnique({ where: { code: code.trim() } }))
      throw new AppError(409, "CODIGO_DUPLICADO", "Já existe disciplina com este código.");
    const d = await prisma.discipline.create({
      data: {
        code: code.trim(), name: name.trim(), ch,
        prerequisites: Array.isArray(prerequisiteIds) && prerequisiteIds.length
          ? { create: prerequisiteIds.map((id: number) => ({ requiresId: id })) }
          : undefined,
      },
    });
    res.status(201).json(d);
  } catch (e) { next(e); }
});

router.put("/disciplinas/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { code, name, ch, prerequisiteIds } = req.body ?? {};
    validateCH(ch);
    const d = await prisma.discipline.update({
      where: { id },
      data: {
        code: String(code).trim(), name: String(name).trim(), ch,
        prerequisites: Array.isArray(prerequisiteIds)
          ? { deleteMany: {}, create: prerequisiteIds.map((pid: number) => ({ requiresId: pid })) }
          : undefined,
      },
    });
    res.json(d);
  } catch (e) { next(e); }
});

/* -------- Professores -------- */
router.get("/professores", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const where = q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {};
    const itens = await prisma.professor.findMany({ where, orderBy: { id: "asc" } });
    res.json({ itens });
  } catch (e) { next(e); }
});

router.post("/professores", async (req, res, next) => {
  try {
    const { name, email } = req.body ?? {};
    if (!name || !email) throw new AppError(400, "DADOS_INVALIDOS", "Nome e e-mail são obrigatórios.");
    if (await prisma.professor.findUnique({ where: { email } }))
      throw new AppError(409, "EMAIL_DUPLICADO", "Já existe professor com este e-mail.");
    res.status(201).json(await prisma.professor.create({ data: { name, email } }));
  } catch (e) { next(e); }
});

/* -------- Turmas -------- */
router.get("/turmas", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "10"), 10) || 10));
    const where = q
      ? { discipline: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } }
      : {};
    const [total, itens] = await Promise.all([
      prisma.classGroup.count({ where }),
      prisma.classGroup.findMany({
        where, orderBy: { id: "asc" }, skip: (page - 1) * pageSize, take: pageSize,
        include: { discipline: true, professor: true, enrollments: { where: { status: "ATIVA" } } },
      }),
    ]);
    res.json({
      page, pageSize, total,
      itens: itens.map((t) => ({
        id: t.id,
        disciplina: { codigo: t.discipline.code, nome: t.discipline.name },
        professor: t.professor.name,
        vagas: t.vagas,
        ocupadas: t.enrollments.length,
      })),
    });
  } catch (e) { next(e); }
});

router.post("/turmas", async (req, res, next) => {
  try {
    const { disciplineId, professorId, vagas } = req.body ?? {};
    if (typeof vagas !== "number" || vagas < 1)
      throw new AppError(400, "VAGAS_INVALIDAS", "Vagas devem ser ao menos 1.");
    res.status(201).json(await prisma.classGroup.create({ data: { disciplineId, professorId, vagas } }));
  } catch (e) { next(e); }
});

router.patch("/turmas/:id/vagas", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { vagas } = req.body ?? {};
    if (typeof vagas !== "number" || vagas < 1)
      throw new AppError(400, "VAGAS_INVALIDAS", "Vagas devem ser ao menos 1.");
    const t = await prisma.classGroup.findUnique({
      where: { id }, include: { enrollments: { where: { status: "ATIVA" } } },
    });
    if (!t) throw new AppError(404, "TURMA_NAO_ENCONTRADA", "Turma não encontrada.");
    if (vagas < t.enrollments.length)
      throw new AppError(
        409, "VAGAS_ABAIXO_OCUPADAS",
        `Não é possível reduzir para menos que ${t.enrollments.length} alunos já matriculados.`,
      );
    res.json(await prisma.classGroup.update({ where: { id }, data: { vagas } }));
  } catch (e) { next(e); }
});

export default router;