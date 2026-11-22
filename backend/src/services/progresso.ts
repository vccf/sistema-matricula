import { prisma } from "../db";
import { AppError } from "../errors";
import { calcularProgressoCore } from "./progresso-core";

export async function calcularProgresso(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      course: { include: { curriculum: true } },
      history: { include: { discipline: true } },
      enrollments: {
        where: { status: "ATIVA" },
        include: { classGroup: { include: { discipline: true } } },
      },
    },
  });
  if (!student) throw new AppError(404, "ALUNO_NAO_ENCONTRADO", "Aluno não encontrado.");

  return calcularProgressoCore({
    curso: {
      id: student.course.id,
      nome: student.course.name,
      chObrigatoria: student.course.chObrigatoria,
      chPerfil: student.course.chPerfil,
      chLivre: student.course.chLivre,
    },
    curriculo: student.course.curriculum.map((c) => ({
      disciplineId: c.disciplineId,
      tipo: c.type as "OBRIGATORIA" | "ELETIVA_PERFIL",
    })),
    historicoAprovado: student.history
      .filter((h) => h.status === "APROVADA")
      .map((h) => ({ disciplineId: h.disciplineId, ch: h.discipline.ch })),
    matriculasAtivas: student.enrollments.map((e) => ({
      disciplineId: e.classGroup.disciplineId,
      ch: e.classGroup.discipline.ch,
    })),
  });
}