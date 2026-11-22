import { ReactNode } from "react";

export function Loading() {
  return <p className="muted">Carregando…</p>;
}

export function Empty({ msg = "Nenhum resultado." }: { msg?: string }) {
  return <p className="muted">{msg}</p>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error">
      <div>{message}</div>
      {onRetry && (
        <button className="ghost" style={{ marginTop: 8 }} onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function RenderState({
  loading, error, empty, emptyMsg, onRetry, children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMsg?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={onRetry} />;
  if (empty) return <Empty msg={emptyMsg} />;
  return <>{children}</>;
}