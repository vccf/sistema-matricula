import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Ofertas from "./pages/Ofertas";
import MinhasMatriculas from "./pages/MinhasMatriculas";
import Progresso from "./pages/Progresso";
import Disciplinas from "./pages/Disciplinas";
import Professores from "./pages/Professores";
import Turmas from "./pages/Turmas";

export default function App() {
  const { user } = useAuth();
  const home = user?.role === "ALUNO" ? "/aluno/ofertas" : user?.role === "SECRETARIA" ? "/secretaria/disciplinas" : "/login";

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute role="ALUNO">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/aluno/ofertas" element={<Ofertas />} />
        <Route path="/aluno/matriculas" element={<MinhasMatriculas />} />
        <Route path="/aluno/progresso" element={<Progresso />} />
      </Route>
      <Route
        element={
          <ProtectedRoute role="SECRETARIA">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/secretaria/disciplinas" element={<Disciplinas />} />
        <Route path="/secretaria/professores" element={<Professores />} />
        <Route path="/secretaria/turmas" element={<Turmas />} />
      </Route>
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}