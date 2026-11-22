import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const linksByRole: Record<"SECRETARIA" | "ALUNO", { to: string; label: string }[]> = {
  SECRETARIA: [
    { to: "/secretaria/disciplinas", label: "Disciplinas" },
    { to: "/secretaria/professores", label: "Professores" },
    { to: "/secretaria/turmas", label: "Turmas" },
  ],
  ALUNO: [
    { to: "/aluno/ofertas", label: "Ofertas" },
    { to: "/aluno/matriculas", label: "Minhas matrículas" },
    { to: "/aluno/progresso", label: "Progresso" },
  ],
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div>
      <nav className="nav">
        {linksByRole[user.role].map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "active" : "")}>
            {l.label}
          </NavLink>
        ))}
        <span style={{ marginLeft: "auto" }} className="muted">{user.username}</span>
        <button className="ghost" onClick={() => { logout(); navigate("/login"); }}>Sair</button>
      </nav>
      <main className="container"><Outlet /></main>
    </div>
  );
}