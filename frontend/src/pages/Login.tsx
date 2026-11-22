import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { getApiErrorMessage } from "../api";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(user.role === "ALUNO" ? "/aluno/ofertas" : "/secretaria/disciplinas", { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim());
      const raw = localStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      navigate(u?.role === "ALUNO" ? "/aluno/ofertas" : "/secretaria/disciplinas", { replace: true });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
      <div className="card">
        <h2>Sistema de Matrícula</h2>
        <p className="muted">Entre com seu nome de usuário.</p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Usuário (ex.: aluno.ec ou secretaria)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading || !username.trim()}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        <p className="muted" style={{ marginTop: 12 }}>
          Usuários do seed: <code>secretaria</code>, <code>aluno.ec</code>, <code>aluno.cc</code>
        </p>
      </div>
    </div>
  );
}