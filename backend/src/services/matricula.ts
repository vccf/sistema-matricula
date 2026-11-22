import { prisma } from "../db";
import { AppError } from "../errors";
import { validarMatricula } from "./matricula-rules";

export async function matricular(studentId: number, classGroupId: number) {
  return prisma.$transaction(async (tx) => {
    const turma = await tx.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
        discipline: { include: { prerequisites: { include: { requires: true } } } },
        enrollments: { where: { status: "ATIVA" } },
      },
    });
    if (!turma) throw new AppError(404, "TURMA_NAO_ENCONTRADA", "Turma não encontrada.");

    const jaAprovado = !!(await tx.historyEntry.findFirst({
      where: { studentId, disciplineId: turma.disciplineId, status: "APROVADA" },
    }));
    const jaMatriculadoDisciplina = !!(await tx.enrollment.findFirst({
      where: { studentId, status: "ATIVA", classGroup: { disciplineId: turma.disciplineId } },
    }));

    const preReqs: { codigo: string; nome: string; aprovado: boolean }[] = [];
    for (const p of turma.discipline.prerequisites) {
      const ok = !!(await tx.historyEntry.findFirst({
        where: { studentId, disciplineId: p.requiresId, status: "APROVADA" },
      }));
      preReqs.push({ codigo: p.requires.code, nome: p.requires.name, aprovado: ok });
    }

    const r = validarMatricula({
      vagas: turma.vagas,
      matriculasAtivasTurma: turma.enrollments.length,
      jaAprovado,
      jaMatriculadoDisciplina,
      preRequisitos: preReqs,
    });
    if (!r.ok) {
      const status = r.code === "PRE_REQUISITO" ? 422 : 409;
      throw new AppError(status, r.code, r.message);
    }
    return tx.enrollment.create({ data: { studentId, classGroupId, status: "ATIVA" } });
  });
}

export async function cancelar(studentId: number, enrollmentId: number) {
  return prisma.$transaction(async (tx) => {
    const enr = await tx.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enr || enr.studentId !== studentId)
      throw new AppError(404, "MATRICULA_NAO_ENCONTRADA", "Matrícula não encontrada.");
    if (enr.status !== "ATIVA")
      throw new AppError(409, "MATRICULA_INATIVA", "Esta matrícula já está cancelada.");
    return tx.enrollment.update({ where: { id: enrollmentId }, data: { status: "CANCELADA" } });
  });
}