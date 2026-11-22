import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { RenderState } from "../components/Estado";

interface Matricula {
  id: number;
  turmaId: number;
  disciplina: { codigo: string; nome: string; ch: number };
  professor: string;
}

export default function MinhasMatriculas() {
  const [itens, setItens] = useState<Matricula[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api<Matricula[]>("/aluno/matriculas")
      .then((r) => { if (alive) setItens(r); })
      .catch((e) => { if (alive) setError(getApiErrorMessage(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  async function cancelar(id: number) {
    if (!confirm("Cancelar esta matrícula?")) return;
    setActionError(null);
    setBusyId(id);
    try {
      await api(`/aluno/matriculas/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2>Minhas matrículas</h2>
      {actionError && (
        <div className="error" style={{ marginBottom: 12 }}>
          {actionError}
          <button className="ghost" style={{ marginLeft: 8 }} onClick={() => setActionError(null)}>Fechar</button>
        </div>
      )}
      <RenderState
        loading={loading}
        error={error}
        empty={!!itens && itens.length === 0}
        emptyMsg="Você não possui matrículas ativas."
        onRetry={() => setRefreshKey((k) => k + 1)}
      >
        {itens?.map((m) => (
          <div className="card" key={m.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{m.disciplina.codigo}</strong> — {m.disciplina.nome}
                <div className="muted">Prof. {m.professor} · {m.disciplina.ch}h</div>
              </div>
              <button
                className="danger"
                disabled={busyId === m.id}
                onClick={() => cancelar(m.id)}
              >
                {busyId === m.id ? "Cancelando…" : "Cancelar"}
              </button>
            </div>
          </div>
        ))}
      </RenderState>
    </div>
  );
}