import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // reset (ordem inversa de FKs)
  await prisma.enrollment.deleteMany();
  await prisma.historyEntry.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.curriculumEntry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.course.deleteMany();

  // Dois cursos que compartilham disciplinas (classificações diferentes)
  const ec = await prisma.course.create({
    data: { code: "EC", name: "Engenharia da Computação", chObrigatoria: 120, chPerfil: 60, chLivre: 60 },
  });
  const cc = await prisma.course.create({
    data: { code: "CC", name: "Ciência da Computação", chObrigatoria: 120, chPerfil: 30, chLivre: 90 },
  });

  const [d1, d2, d3, d4, d5, d6] = await Promise.all([
    prisma.discipline.create({ data: { code: "IF668", name: "Introdução à Computação", ch: 60 } }),
    prisma.discipline.create({ data: { code: "IF669", name: "Introdução à Programação", ch: 60 } }),
    prisma.discipline.create({ data: { code: "IF670", name: "Matemática Discreta", ch: 60 } }),
    prisma.discipline.create({ data: { code: "IF671", name: "Estruturas de Dados", ch: 60 } }),
    prisma.discipline.create({ data: { code: "IF672", name: "Algoritmos", ch: 60 } }),
    prisma.discipline.create({ data: { code: "IF673", name: "Banco de Dados", ch: 60 } }),
  ]);

  // Requisito extra: pré-requisitos
  await prisma.prerequisite.createMany({
    data: [
      { disciplineId: d4.id, requiresId: d2.id }, // IF671 requer IF669
      { disciplineId: d5.id, requiresId: d4.id }, // IF672 requer IF671
    ],
  });

  // Currículos — mesmas disciplinas, classificações diferentes
  await prisma.curriculumEntry.createMany({
    data: [
      { courseId: ec.id, disciplineId: d1.id, type: "OBRIGATORIA" },
      { courseId: ec.id, disciplineId: d2.id, type: "OBRIGATORIA" },
      { courseId: ec.id, disciplineId: d3.id, type: "OBRIGATORIA" },
      { courseId: ec.id, disciplineId: d4.id, type: "OBRIGATORIA" },
      { courseId: ec.id, disciplineId: d5.id, type: "ELETIVA_PERFIL" },
      { courseId: ec.id, disciplineId: d6.id, type: "ELETIVA_PERFIL" },

      { courseId: cc.id, disciplineId: d1.id, type: "OBRIGATORIA" },
      { courseId: cc.id, disciplineId: d2.id, type: "OBRIGATORIA" },
      { courseId: cc.id, disciplineId: d3.id, type: "OBRIGATORIA" },
      { courseId: cc.id, disciplineId: d4.id, type: "ELETIVA_PERFIL" }, // compartilhada, classificação diferente
      { courseId: cc.id, disciplineId: d5.id, type: "OBRIGATORIA" },
      { courseId: cc.id, disciplineId: d6.id, type: "ELETIVA_PERFIL" },
    ],
  });

  // Professores
  const prof1 = await prisma.professor.create({ data: { name: "Ana Silva", email: "ana.silva@cin.ufpe.br" } });
  const prof2 = await prisma.professor.create({ data: { name: "Bruno Costa", email: "bruno.costa@cin.ufpe.br" } });

  // Usuário da secretaria
  await prisma.user.create({
    data: { username: "secretaria", password: null, role: "SECRETARIA" },
  });

  // Aluno de EC (tem aprovações e reprovações)
  const userAlunoEC = await prisma.user.create({
    data: { username: "aluno.ec", password: null, role: "ALUNO" },
  });
  const alunoEC = await prisma.student.create({
    data: { name: "Carlos EC", userId: userAlunoEC.id, courseId: ec.id },
  });

  // Aluno de CC
  const userAlunoCC = await prisma.user.create({
    data: { username: "aluno.cc", password: null, role: "ALUNO" },
  });
  const alunoCC = await prisma.student.create({
    data: { name: "Diana CC", userId: userAlunoCC.id, courseId: cc.id },
  });

  // Histórico do aluno EC: aprovado em IF668, IF669, IF670; reprovado em IF671
  await prisma.historyEntry.createMany({
    data: [
      { studentId: alunoEC.id, disciplineId: d1.id, status: "APROVADA", semester: "2024.1" },
      { studentId: alunoEC.id, disciplineId: d2.id, status: "APROVADA", semester: "2024.1" },
      { studentId: alunoEC.id, disciplineId: d3.id, status: "APROVADA", semester: "2024.2" },
      { studentId: alunoEC.id, disciplineId: d4.id, status: "REPROVADA", semester: "2024.2" },
    ],
  });

  // Histórico do aluno CC
  await prisma.historyEntry.createMany({
    data: [
      { studentId: alunoCC.id, disciplineId: d1.id, status: "APROVADA", semester: "2024.1" },
      { studentId: alunoCC.id, disciplineId: d2.id, status: "APROVADA", semester: "2024.1" },
    ],
  });

  // Turmas do semestre corrente
  await prisma.classGroup.createMany({
    data: [
      { disciplineId: d1.id, professorId: prof1.id, vagas: 30 },
      { disciplineId: d2.id, professorId: prof1.id, vagas: 25 },
      { disciplineId: d3.id, professorId: prof2.id, vagas: 20 },
      { disciplineId: d4.id, professorId: prof2.id, vagas: 2 }, // turma pequena para testar "lotada"
      { disciplineId: d5.id, professorId: prof1.id, vagas: 15 },
      { disciplineId: d6.id, professorId: prof2.id, vagas: 10 },
    ],
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());