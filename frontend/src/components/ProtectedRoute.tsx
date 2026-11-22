import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export function ProtectedRoute({ role, children }: { role: "SECRETARIA" | "ALUNO"; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "ALUNO" ? "/aluno/ofertas" : "/secretaria/disciplinas"} replace />;
  return <>{children}</>;
}