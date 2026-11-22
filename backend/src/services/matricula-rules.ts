export interface ContextoMatricula {
  vagas: number;
  matriculasAtivasTurma: number;
  jaAprovado: boolean;
  jaMatriculadoDisciplina: boolean;
  preRequisitos: { codigo: string; nome: string; aprovado: boolean }[];
}

export type ResultadoRegra =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validarMatricula(ctx: ContextoMatricula): ResultadoRegra {
  if (ctx.matriculasAtivasTurma >= ctx.vagas)
    return { ok: false, code: "TURMA_LOTADA", message: "Não há vagas disponíveis nesta turma." };
  if (ctx.jaAprovado)
    return { ok: false, code: "JA_APROVADO", message: "Você já foi aprovado nesta disciplina." };
  if (ctx.jaMatriculadoDisciplina)
    return { ok: false, code: "JA_MATRICULADO", message: "Você já está matriculado nesta disciplina." };
  const pendente = ctx.preRequisitos.find((p) => !p.aprovado);
  if (pendente)
    return {
      ok: false,
      code: "PRE_REQUISITO",
      message: `Pré-requisito não cumprido: ${pendente.codigo} - ${pendente.nome}.`,
    };
  return { ok: true };
}