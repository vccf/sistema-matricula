import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../api";
import { useDebounce } from "../useDebounce";
import { RenderState } from "../components/Estado";
import { Paginacao } from "../components/Paginacao";

interface Turma {
  id: number;
  disciplina: { codigo: string; nome: string };
  professor: string;
  vagas: number;
  ocupadas: number;
}
interface Resp { page: number; pageSize: number; total: number; itens: Turma[] }
interface Disciplina { id: number; code: string; name: string }
interface Professor { id: number; name: string }

export default function Turmas() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const debouncedQ = useDebounce(q, 300);

  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  // dados auxiliares para o form
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  const [form, setForm] = useState({ disciplineId: 0, professorId: 0, vagas: 10 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ itens: Disciplina[] }>("/secretaria/disciplinas?pageSize=100").then((r) => setDisciplinas(r.itens)).catch(() => {});
    api<{ itens: Professor[] }>("/secretaria/professores").then((r) => setProfessores(r.itens)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    api<Resp>(`/secretaria/turmas?q=${encodeURIComponent(debouncedQ)}&page=${page}&pageSize=10`)
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
  function setPage(n: number) {
    const p = new URLSearchParams(params); p.set("page", String(n)); setParams(p);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setActionError(null); setSaving(true);
    try {
      await api("/secretaria/turmas", {
        method: "POST",
        body: JSON.stringify({
          disciplineId: Number(form.disciplineId),
          professorId: Number(form.professorId),
          vagas: Number(form.vagas),
        }),
      });
      setForm({ disciplineId: 0, professorId: 0, vagas: 10 });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function alterarVagas(id: number, atual: number) {
    const raw = prompt(`Nova quantidade de vagas (atual: ${atual}):`, String(atual));
    if (raw == null) return;
    const vagas = Number(raw);
    if (!Number.isInteger(vagas) || vagas < 1) {
      setActionError("Vagas devem ser um inteiro ≥ 1.");
      return;
    }
    setActionError(null);
    try {
      await api(`/secretaria/turmas/${id}/vagas`, {
        method: "PATCH",
        body: JSON.stringify({ vagas }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(getApiErrorMessage(e));
    }
  }

  return (
    <div>
      <h2>Turmas</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Abrir turma</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <div className="row">
            <select
              value={form.disciplineId}
              onChange={(e) => setForm({ ...form, disciplineId: Number(e.target.value) })}
              style={{ maxWidth: 260 }}
            >
              <option value={0}>Disciplina…</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
              ))}
            </select>
            <select
              value={form.professorId}
              onChange={(e) => setForm({ ...form, professorId: Number(e.target.value) })}
              style={{ maxWidth: 240 }}
            >
              <option value={0}>Professor…</option>
              {professores.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              type="number" min={1} value={form.vagas}
              onChange={(e) => setForm({ ...form, vagas: Number(e.target.value) })}
              style={{ maxWidth: 100 }}
              placeholder="Vagas"
            />
          </div>
          {actionError && <div className="error">{actionError}</div>}
          <button type="submit" disabled={saving || !form.disciplineId || !form.professorId}>
            {saving ? "Abrindo…" : "Abrir turma"}
          </button>
        </form>
      </div>

      <input placeholder="Buscar por disciplina" value={q} onChange={(e) => setQ(e.target.value)} />

      <div style={{ marginTop: 12 }}>
        <RenderState loading={loading} error={error} empty={!!data && data.itens.length === 0}
          emptyMsg={q ? `Sem resultado para "${q}".` : "Nenhuma turma aberta."}
          onRetry={() => setRefreshKey((k) => k + 1)}>
          {data?.itens.map((t) => (
            <div className="card" key={t.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{t.disciplina.codigo}</strong> — {t.disciplina.nome}
                  <div className="muted">Prof. {t.professor}</div>
                  <div className="muted">
                    Vagas: {t.ocupadas} / {t.vagas}
                    {t.ocupadas >= t.vagas && <span className="badge lotada" style={{ marginLeft: 8 }}>Lotada</span>}
                  </div>
                </div>
                <button className="ghost" onClick={() => alterarVagas(t.id, t.vagas)}>Alterar vagas</button>
              </div>
            </div>
          ))}
        </RenderState>
      </div>

      {data && <Paginacao page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />}
    </div>
  );
}