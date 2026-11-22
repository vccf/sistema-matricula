export type Grupo = "OBRIGATORIA" | "ELETIVA_PERFIL" | "ELETIVA_LIVRE";

export interface InputProgresso {
  curso: { id: number; nome: string; chObrigatoria: number; chPerfil: number; chLivre: number };
  curriculo: { disciplineId: number; tipo: "OBRIGATORIA" | "ELETIVA_PERFIL" }[];
  historicoAprovado: { disciplineId: number; ch: number }[];
  matriculasAtivas: { disciplineId: number; ch: number }[];
}

export interface GrupoProgresso {
  exigida: number; integralizada: number; emCurso: number; falta: number; percentual: number;
}

export function calcularProgressoCore(input: InputProgresso) {
  const curr = new Map(input.curriculo.map((c) => [c.disciplineId, c.tipo] as const));
  const req = {
    OBRIGATORIA: input.curso.chObrigatoria,
    ELETIVA_PERFIL: input.curso.chPerfil,
    ELETIVA_LIVRE: input.curso.chLivre,
  };
  const integ = { OBRIGATORIA: 0, ELETIVA_PERFIL: 0, ELETIVA_LIVRE: 0 };
  const curso = { OBRIGATORIA: 0, ELETIVA_PERFIL: 0, ELETIVA_LIVRE: 0 };

  const classificar = (id: number): Grupo => curr.get(id) ?? "ELETIVA_LIVRE";

  // 1) histórico aprovado (dedup por disciplina — reprovações são descartadas antes de entrar aqui)
  const aprovadas = new Map<number, number>();
  for (const h of input.historicoAprovado) {
    if (!aprovadas.has(h.disciplineId)) aprovadas.set(h.disciplineId, h.ch);
  }
  for (const [disc, ch] of aprovadas) {
    const g = classificar(disc);
    if (g === "ELETIVA_PERFIL") {
      const room = Math.max(0, req.ELETIVA_PERFIL - integ.ELETIVA_PERFIL);
      const take = Math.min(ch, room);
      integ.ELETIVA_PERFIL += take;
      integ.ELETIVA_LIVRE += ch - take;        // regra 11: excesso vira livre
    } else integ[g] += ch;
  }

  // 2) matrículas ativas (não pode duplicar disciplina já aprovada)
  for (const m of input.matriculasAtivas) {
    if (aprovadas.has(m.disciplineId)) continue;
    const g = classificar(m.disciplineId);
    if (g === "ELETIVA_PERFIL") {
      const room = Math.max(
        0,
        req.ELETIVA_PERFIL - integ.ELETIVA_PERFIL - curso.ELETIVA_PERFIL
      );
      const take = Math.min(m.ch, room);
      curso.ELETIVA_PERFIL += take;
      curso.ELETIVA_LIVRE += m.ch - take;
    } else curso[g] += m.ch;
  }

  const montar = (g: Grupo): GrupoProgresso => {
    const exigida = req[g];
    const integralizada = integ[g];
    const emCurso = curso[g];
    const falta = Math.max(0, exigida - integralizada - emCurso); // regra 13
    const percentual = exigida === 0 ? 100 : Math.min(100, Math.round((integralizada / exigida) * 100));
    return { exigida, integralizada, emCurso, falta, percentual };
  };

  return {
    curso: input.curso,
    grupos: {
      OBRIGATORIA: montar("OBRIGATORIA"),
      ELETIVA_PERFIL: montar("ELETIVA_PERFIL"),
      ELETIVA_LIVRE: montar("ELETIVA_LIVRE"),
    },
  };
}