import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../api";
import { useDebounce } from "../useDebounce";
import { RenderState } from "../components/Estado";
import { Paginacao } from "../components/Paginacao";

interface Discipline {
  id: number; code: string; name: string; ch: number;
  prerequisites: { requires: { id: number; code: string; name: string } }[];
}
interface Resp { page: number; pageSize: number; total: number; itens: Discipline[] }

const emptyForm = { id: 0, code: "", name: "", ch: 60 };

export default function Disciplinas() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const debouncedQ = useDebounce(q, 300);

  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    api<Resp>(`/secretaria/disciplinas?q=${encodeURIComponent(debouncedQ)}&page=${page}&pageSize=10`)
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
    setFormError(null); setSaving(true);
    try {
      if (form.id) {
        await api(`/secretaria/disciplinas/${form.id}`, {
          method: "PUT",
          body: JSON.stringify({ code: form.code, name: form.name, ch: Number(form.ch) }),
        });
      } else {
        await api("/secretaria/disciplinas", {
          method: "POST",
          body: JSON.stringify({ code: form.code, name: form.name, ch: Number(form.ch) }),
        });
      }
      setForm(emptyForm);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Disciplinas</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{form.id ? "Editar disciplina" : "Cadastrar disciplina"}</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <div className="row">
            <input placeholder="Código (IF668)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="number" placeholder="CH" min={15} max={120} step={15} value={form.ch}
              onChange={(e) => setForm({ ...form, ch: Number(e.target.value) })} style={{ maxWidth: 100 }} />
          </div>
          {formError && <div className="error">{formError}</div>}
          <div className="row">
            <button type="submit" disabled={saving}>{saving ? "Salvando…" : form.id ? "Salvar" : "Cadastrar"}</button>
            {form.id > 0 && (
              <button type="button" className="ghost" onClick={() => setForm(emptyForm)}>Cancelar edição</button>
            )}
          </div>
        </form>
      </div>

      <input placeholder="Buscar por código ou nome" value={q} onChange={(e) => setQ(e.target.value)} />

      <div style={{ marginTop: 12 }}>
        <RenderState loading={loading} error={error} empty={!!data && data.itens.length === 0}
          emptyMsg={q ? `Sem resultado para "${q}".` : "Nenhuma disciplina cadastrada."}
          onRetry={() => setRefreshKey((k) => k + 1)}>
          {data?.itens.map((d) => (
            <div className="card" key={d.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div><strong>{d.code}</strong> — {d.name} ({d.ch}h)</div>
                <button className="ghost" onClick={() => setForm({ id: d.id, code: d.code, name: d.name, ch: d.ch })}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </RenderState>
      </div>

      {data && <Paginacao page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />}
    </div>
  );
}