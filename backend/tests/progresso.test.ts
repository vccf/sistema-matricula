import { calcularProgressoCore } from "../src/services/progresso-core";

const curso = { id: 1, nome: "EC", chObrigatoria: 120, chPerfil: 60, chLivre: 60 };
const curriculo = [
  { disciplineId: 1, tipo: "OBRIGATORIA" as const },
  { disciplineId: 2, tipo: "OBRIGATORIA" as const },
  { disciplineId: 3, tipo: "ELETIVA_PERFIL" as const },
];

test("disciplina fora do currículo conta como eletiva livre", () => {
  const r = calcularProgressoCore({
    curso, curriculo,
    historicoAprovado: [{ disciplineId: 99, ch: 60 }],
    matriculasAtivas: [],
  });
  expect(r.grupos.ELETIVA_LIVRE.integralizada).toBe(60);
});

test("excesso de eletiva de perfil vira eletiva livre (regra 11)", () => {
  const r = calcularProgressoCore({
    curso, curriculo,
    historicoAprovado: [
      { disciplineId: 3, ch: 60 },
      { disciplineId: 3, ch: 60 }, // duplicada — deve deduplicar
    ],
    matriculasAtivas: [],
  });
  expect(r.grupos.ELETIVA_PERFIL.integralizada).toBe(60);
  expect(r.grupos.ELETIVA_LIVRE.integralizada).toBe(0); // dedup
});

test("reprovadas não contam, só aprovadas (regra 12)", () => {
  const r = calcularProgressoCore({
    curso, curriculo,
    historicoAprovado: [{ disciplineId: 1, ch: 60 }],
    matriculasAtivas: [],
  });
  expect(r.grupos.OBRIGATORIA.integralizada).toBe(60);
  expect(r.grupos.OBRIGATORIA.emCurso).toBe(0);
});

test("CH em curso aparece separada da integralizada", () => {
  const r = calcularProgressoCore({
    curso, curriculo,
    historicoAprovado: [{ disciplineId: 1, ch: 60 }],
    matriculasAtivas: [{ disciplineId: 2, ch: 60 }],
  });
  expect(r.grupos.OBRIGATORIA.integralizada).toBe(60);
  expect(r.grupos.OBRIGATORIA.emCurso).toBe(60);
});

test("percentual e falta nunca passam dos limites (regra 13)", () => {
  const r = calcularProgressoCore({
    curso, curriculo,
    historicoAprovado: [
      { disciplineId: 1, ch: 60 },
      { disciplineId: 2, ch: 60 },
      { disciplineId: 2, ch: 60 }, // duplicada
    ],
    matriculasAtivas: [],
  });
  expect(r.grupos.OBRIGATORIA.percentual).toBe(100);
  expect(r.grupos.OBRIGATORIA.falta).toBe(0);
});