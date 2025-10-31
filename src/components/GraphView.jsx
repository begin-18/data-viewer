import React from "react";
import { Pie } from "react-chartjs-2";
import { FiActivity, FiCheckCircle, FiThermometer } from "react-icons/fi";

const iconMap = { "Thermal Data": <FiThermometer size={20} />, "Acoustic Data": <FiCheckCircle size={20} />, "Vibration Data": <FiActivity size={20} /> };

export default function GraphView({ faultCounts, currentTheme }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, overflowY: "auto", padding: 12 }}>
      {["Thermal Data", "Acoustic Data", "Vibration Data"].map(tab => {
        const counts = faultCounts[tab];
        const colors = ["#fef3c7", "#fee2e2", "#fcd34d", "#d1fae5"];
        const pieData = {
          labels: Object.keys(counts),
          datasets: [{ label: `${tab} Faults`, data: Object.values(counts), backgroundColor: colors }]
        };
        return (
          <div key={tab} style={{ flex: "1 1 300px", background: currentTheme.cardBg, padding: 20, borderRadius: 16, boxShadow: currentTheme.cardShadow }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16, color: currentTheme.textColor }}>
              {iconMap[tab]} {tab} Faults
            </h3>
            <Pie data={pieData} />
          </div>
        );
      })}
    </div>
  );
}
