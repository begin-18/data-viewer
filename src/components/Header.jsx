import React from "react";

const headerFontStyle = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  letterSpacing: "0.02em",
};

export default function Header() {
  return (
    <header style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      borderBottom: "1px solid #1e293b",
      background: "#0f172a", // Permanent Dark
      flex: "0 0 auto",
      ...headerFontStyle
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 4, height: 28, background: '#3b82f6', borderRadius: 2 }} />
        <h1 style={{ 
          fontSize: 16, 
          margin: 0, 
          fontWeight: 800, 
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#f8fafc" 
        }}>
          Multimodal Anomaly Detection
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ 
          padding: "4px 12px", 
          borderRadius: "20px", 
          background: "rgba(59, 130, 246, 0.1)", 
          border: "1px solid rgba(59, 130, 246, 0.2)",
          fontSize: "0.7rem",
          fontWeight: "700",
          color: "#3b82f6",
          textTransform: "uppercase"
        }}>
          System Live
        </div>
      </div>
    </header>
  );
}