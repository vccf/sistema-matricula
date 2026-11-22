import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../api";
import { useDebounce } from "../useDebounce";
import { RenderState } from "../components/Estado";
import { Paginacao } from "../components/Paginacao";

interface Oferta {
  id: number;
  disciplina: { id: number; codigo: string; nome: string; ch: number };
  professor: { id: number; nome: string };
  vagas: number;
  ocupadas: number;
  disponiveis: number;
  grupo: "OBRIGATORIA" | "ELETIVA_PERFIL" | "ELETIVA_LIVRE";
  preRequisitos: { codigo: string; nome: string }[];
  jaAprovado: boolean;
  jaMatriculado: boolean;
}
interface Resp { page: number; pageSize: number; total: number; itens: Oferta[] }

const grupoLabel: Record<Oferta["grupo"], string> = {
  OBRIGATORIA: "Obrigatória",
  ELETIVA_PERFIL: "Eletiva de perfil",
  ELETIVA_LIVRE: "Eletiva livre",
};
const grupoClass: Record<Oferta["grupo"], string> = {
  OBRIGATORIA: "obrig",
  ELETIVA_PERFIL: "perfil",
  ELETIVA_LIVRE: "livre",
};

export default function Ofertas() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const debouncedQ = useDebounce(q, 300);

  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api<Resp>(`/aluno/ofertas?q=${encodeURIComponent(debouncedQ)}&page=${page}&pageSize=10`)
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setError(getApiErrorMessage(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [debouncedQ, page, refreshKey]);

  function setQ(next: string) {
    const p = new URLSearchParams(params);
    if (next) p.set("q", next); else p.delete("q");
    p.set("page", "1");
    setParams(p, { replace: true });
  }
  function setPage(next: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(next));
    setParams(p);
  }

  async function matricular(turmaId: number) {
    setActionError(null);
    setBusyId(turmaId);
    try {
      await api("/aluno/matriculas", {
        method: "POST",
        body: JSON.stringify({ classGroupId: turmaId }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2>Ofertas do semestre</h2>
      <input
        placeholder="Buscar por código, nome ou professor"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar ofertas"
      />

      {actionError && (
        <div className="error" style={{ marginTop: 12 }}>
          <div>{actionError}</div>
          <button className="ghost" style={{ marginTop: 8 }} onClick={() => setActionError(null)}>Fechar</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <RenderState
          loading={loading}
          error={error}
          empty={!!data && data.itens.length === 0}
          emptyMsg={q ? `Nenhuma oferta encontrada para "${q}".` : "Nenhuma oferta disponível."}
          onRetry={() => setRefreshKey((k) => k + 1)}
        >
          {data?.itens.map((o) => {
            const lotada = o.disponiveis <= 0;
            const motivoBloqueio = o.jaAprovado
              ? "Você já foi aprovado nesta disciplina."
              : o.jaMatriculado
              ? "Você já está matriculado nesta disciplina."
              : lotada
              ? "Turma lotada."
              : null;
            return (
              <div className="card" key={o.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{o.disciplina.codigo}</strong> — {o.disciplina.nome}
                  </div>
                  <span className={`badge ${grupoClass[o.grupo]}`}>{grupoLabel[o.grupo]}</span>
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Prof. {o.professor.nome} · {o.disciplina.ch}h
                </div>
                <div className="muted">
                  Vagas: {o.disponiveis} de {o.vagas} disponíveis
                </div>
                {o.preRequisitos.length > 0 && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    Pré-requisitos: {o.preRequisitos.map((p) => p.codigo).join(", ")}
                  </div>
                )}
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    disabled={!!motivoBloqueio || busyId === o.id}
                    onClick={() => matricular(o.id)}
                    title={motivoBloqueio ?? undefined}
                  >
                    {busyId === o.id ? "Matriculando…" : "Matricular"}
                  </button>
                  {motivoBloqueio && <span className="muted">{motivoBloqueio}</span>}
                </div>
              </div>
            );
          })}
        </RenderState>
      </div>

      {data && (
        <Paginacao page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
      )}
    </div>
  );
}