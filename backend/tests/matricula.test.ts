import { validarMatricula } from "../src/services/matricula-rules";

const base = {
  vagas: 5,
  matriculasAtivasTurma: 0,
  jaAprovado: false,
  jaMatriculadoDisciplina: false,
  preRequisitos: [] as { codigo: string; nome: string; aprovado: boolean }[],
};

test("matrícula ok quando tudo está válido", () => {
  expect(validarMatricula(base).ok).toBe(true);
});

test("não pode matricular em turma lotada (regra 6)", () => {
  const r = validarMatricula({ ...base, matriculasAtivasTurma: 5 });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.code).toBe("TURMA_LOTADA");
});

test("não pode matricular em disciplina já aprovada (regra 7)", () => {
  const r = validarMatricula({ ...base, jaAprovado: true });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.code).toBe("JA_APROVADO");
});

test("pré-requisito pendente bloqueia a matrícula", () => {
  const r = validarMatricula({
    ...base,
    preRequisitos: [{ codigo: "IF669", nome: "Intro Prog", aprovado: false }],
  });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.code).toBe("PRE_REQUISITO");
});

test("pré-requisito cumprido libera", () => {
  const r = validarMatricula({
    ...base,
    preRequisitos: [{ codigo: "IF669", nome: "Intro Prog", aprovado: true }],
  });
  expect(r.ok).toBe(true);
});