import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Ensure ChartJS is registered inside the component to prevent missing element errors
ChartJS.register(ArcElement, Tooltip, Legend);

export default function FaultSummary({ faultCounts, allRows, currentTheme }) {
  
  // 1. PREVENT CRASH: If data hasn't arrived yet, show a loading message instead of a white screen
  if (!allRows || allRows.length === 0 || !faultCounts) {
    return (
      <div style={{ 
        padding: "50px", 
        textAlign: "center", 
        color: currentTheme?.textColor || "#fff",
        background: currentTheme?.background || "#0f172a",
        height: "100%"
      }}>
        <h2 style={{ animate: "pulse 2s infinite" }}>Analyzing Sensor Data...</h2>
        <p style={{ opacity: 0.7 }}>Synchronizing with Google Sheets API</p>
      </div>
    );
  }

  // 2. DATA PREPARATION: Safety check for each count
  const data = {
    labels: ["Normal", "Imbalance", "Bearing Fault", "Overheating"],
    datasets: [
      {
        data: [
          faultCounts.Normal || 0,
          faultCounts.Imbalance || 0,
          faultCounts["Bearing Fault"] || 0,
          faultCounts.Overheating || 0,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
        hoverOffset: 10,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div style={{ padding: "20px", animation: "fadeIn 0.5s ease-in" }}>
      <h2 style={{ marginBottom: "20px", color: currentTheme.textColor }}>
        System Health & Fault Distribution
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "20px" 
      }}>
        
        {/* CHART CARD */}
        <div style={{ 
          background: currentTheme.cardBg, 
          padding: "30px", 
          borderRadius: "15px", 
          border: `1px solid ${currentTheme.border}`,
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <Pie data={data} options={{ plugins: { legend: { position: 'bottom', labels: { color: currentTheme.textColor } } } }} />
          </div>
        </div>

        {/* STATS CARD */}
        <div style={{ 
          background: currentTheme.cardBg, 
          padding: "30px", 
          borderRadius: "15px", 
          border: `1px solid ${currentTheme.border}`,
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          <h3 style={{ margin: 0, opacity: 0.8 }}>Detection Summary</h3>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{allRows.length} Total Logs</div>
          
          <hr style={{ border: `0.5px solid ${currentTheme.border}`, width: "100%" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
            <span>Normal Operation:</span> <strong>{faultCounts.Normal || 0}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}>
            <span>Imbalance Detected:</span> <strong>{faultCounts.Imbalance || 0}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
            <span>Bearing Failures:</span> <strong>{faultCounts["Bearing Fault"] || 0}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6" }}>
            <span>Thermal Issues:</span> <strong>{faultCounts.Overheating || 0}</strong>
          </div>
        </div>

      </div>
    </div>
  );
}