export function Paginacao({
  page, pageSize, total, onChange,
}: {
  page: number; pageSize: number; total: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
      <span className="muted">
        {total} registro(s) · página {page} de {totalPages}
      </span>
      <div className="row">
        <button className="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
        <button className="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Próxima</button>
      </div>
    </div>
  );
}