import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { RenderState } from "../components/Estado";

interface GrupoProgresso {
  exigida: number; integralizada: number; emCurso: number; falta: number; percentual: number;
}
interface ProgressoResp {
  curso: { id: number; nome: string; chObrigatoria: number; chPerfil: number; chLivre: number };
  grupos: { OBRIGATORIA: GrupoProgresso; ELETIVA_PERFIL: GrupoProgresso; ELETIVA_LIVRE: GrupoProgresso };
}

const label = {
  OBRIGATORIA: "Obrigatórias",
  ELETIVA_PERFIL: "Eletivas de perfil",
  ELETIVA_LIVRE: "Eletivas livres",
} as const;

export default function Progresso() {
  const [data, setData] = useState<ProgressoResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api<ProgressoResp>("/aluno/progresso")
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setError(getApiErrorMessage(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div>
      <h2>Progresso no curso</h2>
      <RenderState
        loading={loading}
        error={error}
        empty={!data}
        emptyMsg="Sem dados de progresso."
        onRetry={() => setRefreshKey((k) => k + 1)}
      >
        {data && (
          <>
            <p className="muted">Curso: <strong>{data.curso.nome}</strong></p>
            {(Object.keys(label) as (keyof typeof label)[]).map((g) => {
              const v = data.grupos[g];
              return (
                <div className="card" key={g}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{label[g]}</strong>
                    <span className="muted">{v.percentual}%</span>
                  </div>
                  <div className="progress-bar" style={{ margin: "8px 0" }}>
                    <div style={{ width: `${v.percentual}%` }} />
                  </div>
                  <div className="muted" style={{ fontSize: 14 }}>
                    Exigida: {v.exigida}h · Integralizada: {v.integralizada}h · Em curso: {v.emCurso}h · Falta: {v.falta}h
                  </div>
                </div>
              );
            })}
          </>
        )}
      </RenderState>
    </div>
  );
}