import { FormEvent, useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { RenderState } from "../components/Estado";

interface Professor { id: number; name: string; email: string }

export default function Professores() {
  const [itens, setItens] = useState<Professor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    api<{ itens: Professor[] }>("/secretaria/professores")
      .then((r) => { if (alive) setItens(r.itens); })
      .catch((e) => { if (alive) setError(getApiErrorMessage(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null); setSaving(true);
    try {
      await api("/secretaria/professores", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "" });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Professores</h2>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cadastrar professor</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <div className="row">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="E-mail único" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {formError && <div className="error">{formError}</div>}
          <button type="submit" disabled={saving}>{saving ? "Salvando…" : "Cadastrar"}</button>
        </form>
      </div>

      <RenderState loading={loading} error={error} empty={!!itens && itens.length === 0}
        emptyMsg="Nenhum professor cadastrado." onRetry={() => setRefreshKey((k) => k + 1)}>
        {itens?.map((p) => (
          <div className="card" key={p.id}>
            <strong>{p.name}</strong>
            <div className="muted">{p.email}</div>
          </div>
        ))}
      </RenderState>
    </div>
  );
}