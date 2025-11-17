// src/components/TableView.jsx
import React from "react";
import PaginationControls from "./PaginationControls";

export default function TableView({
  pageRows,
  displayCols,
  currentPage,
  pageSize,
  totalPages,
  setCurrentPage,
  pageSizeValue,
  setPageSize,
  fetchAll,
  currentTheme,
  btnStyle
}) {
  const tableAreaHeight = `calc(103vh - 212px)`;

  // Map fault_type to icon and color
  const faultTypeMap = {
    normal: { color: "green", icon: "✅" },
    imbalance: { color: "orange", icon: "⚠️" },
    "bearing fault": { color: "red", icon: "⚙️" },
    overheating: { color: "red", icon: "🌡️" }
  };

  return (
    <div style={{ background: currentTheme.tableBg, borderRadius: 12, overflow: "hidden", border: `1px solid ${currentTheme.border}`, flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", height: tableAreaHeight }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: currentTheme.tableHeader, zIndex: 2 }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left", borderBottom: `2px solid ${currentTheme.border}`, fontWeight: 700 }}>#</th>
              {displayCols.map(col => (
                <th key={col} style={{ padding: 12, textAlign: "left", borderBottom: `2px solid ${currentTheme.border}`, fontWeight: 700 }}>
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r._idx} style={{ borderBottom: `1px solid ${currentTheme.border}`, background: i % 2 === 0 ? currentTheme.tableBg : "#2563eb05" }}>
                <td style={{ padding: 12, fontWeight: 500 }}>{(currentPage - 1) * pageSize + i + 1}</td>
                {displayCols.map(col => {
                  if(col === "fault_type") {
                    const ft = (r[col] || "unknown").toLowerCase();
                    const { color, icon } = faultTypeMap[ft] || { color: "gray", icon: "❔" };
                    return (
                      <td key={col} style={{ padding: 12, color, fontWeight: 600 }}>
                        {r[col]} {icon}
                      </td>
                    );
                  }
                  return (
                    <td key={col} style={{ padding: 12, color: currentTheme.tableText }}>
                      {r[col] ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        pageSizeValue={pageSize}
        setPageSize={setPageSize}
        fetchAll={fetchAll}
        currentTheme={currentTheme}
        btnStyle={btnStyle}
      />
    </div>
  );
}
