import React from "react";

export default function PaginationControls({
  currentPage,
  totalPages,
  setCurrentPage,
  pageSizeValue,
  setPageSize,
  fetchAll,
  btnStyle,
  currentTheme
}) {
  return (
    <div style={{ padding: 12, borderTop: `1px solid ${currentTheme.border}`, display: "flex", alignItems: "center", gap: 12, flex: "0 0 auto" }}>
      <button onClick={() => setCurrentPage(1)} style={btnStyle}>⏮ First</button>
      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={btnStyle}>◀ Prev</button>
      <span>
        Page{" "}
        <input
          type="number"
          value={currentPage}
          onChange={e => setCurrentPage(Number(e.target.value) || 1)}
          style={{ width: 60, padding: 4, borderRadius: 6, border: `1px solid ${currentTheme.border}` }}
        />{" "}
        / {totalPages}
      </span>
      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={btnStyle}>Next ▶</button>
      <button onClick={() => setCurrentPage(totalPages)} style={btnStyle}>Last ⏭</button>
      <span>
        | Rows per page:{" "}
        <input
          type="number"
          value={pageSizeValue}
          onChange={e => setPageSize(Number(e.target.value) || 100)}
          style={{ width: 60, padding: 4, borderRadius: 6, border: `1px solid ${currentTheme.border}` }}
        />
      </span>
      <button onClick={fetchAll} style={{ ...btnStyle, marginLeft: "auto" }}>Refresh</button>
    </div>
  );
}
