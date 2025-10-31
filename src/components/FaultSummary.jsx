import React from "react";
import { FiActivity, FiAlertCircle, FiThermometer, FiCheckCircle } from "react-icons/fi";

const iconMap = { "Thermal Data": <FiThermometer size={20} />, "Acoustic Data": <FiCheckCircle size={20} />, "Vibration Data": <FiActivity size={20} /> };

export default function FaultSummary({ faultCounts, theme, currentTheme }) {
  const faultColors = { Imbalance: "#fef3c7", "Bearing Fault": "#fee2e2", Overheating: "#fcd34d", Normal: "#d1fae5" };
  const faultIcons = {
    Imbalance: <FiActivity size={28} color="#f59e0b" />,
    "Bearing Fault": <FiAlertCircle size={28} color="#dc2626" />,
    Overheating: <FiThermometer size={28} color="#b45309" />,
    Normal: <FiCheckCircle size={28} color="#059669" />
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 12px" }}>
      {["Thermal Data", "Acoustic Data", "Vibration Data"].map(tab => (
        <div key={tab} style={{ background: currentTheme.cardBg, borderRadius: 16, padding: 20, boxShadow: currentTheme.cardShadow }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 18, fontWeight: 700, color: currentTheme.textColor }}>
            {iconMap[tab]} {tab} Fault Summary
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 16 }}>
            {Object.entries(faultCounts[tab]).map(([fault, count]) => (
              <div key={fault} style={{
                background: theme === "light" ? faultColors[fault] || "#f3f4f6" : currentTheme.cardBg,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                cursor: "default",
                textAlign: "center",
                color: currentTheme.textColor
              }}>
                {faultIcons[fault]}
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500 }}>{fault}</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
