const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export interface ApiError { code: string; message: string; status: number }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // navega para login sem depender do Router
    if (window.location.pathname !== "/login") window.location.href = "/login";
    throw { code: "NAO_AUTENTICADO", message: "Sessão expirada.", status: 401 } as ApiError;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      code: body.code ?? "ERRO",
      message: body.message ?? "Erro na requisição.",
      status: res.status,
    } as ApiError;
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export function getApiErrorMessage(e: unknown): string {
  if (typeof e === "object" && e && "message" in e) return String((e as any).message);
  return "Erro inesperado.";
}