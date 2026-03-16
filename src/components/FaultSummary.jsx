import React, { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Activity, AlertTriangle, CheckCircle2, Thermometer, Database } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

// Professional typography style object
const fontStyle = {
  fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  letterSpacing: "-0.01em"
};

export default function FaultSummary({ thermalData = [], acousticData = [], vibrationData = [], currentTheme }) {
  
  const stats = useMemo(() => {
    const counts = { Normal: 0, Imbalance: 0, "Bearing Fault": 0, Overheating: 0 };
    
    [thermalData, acousticData, vibrationData].forEach(dataset => {
      dataset.forEach(row => {
        const type = row.fault_type;
        if (counts.hasOwnProperty(type)) {
          counts[type]++;
        }
      });
    });

    const total = thermalData.length + acousticData.length + vibrationData.length;
    return { counts, total };
  }, [thermalData, acousticData, vibrationData]);

  const chartData = {
    labels: ["Normal", "Imbalance", "Bearing Fault", "Overheating"],
    datasets: [{
      data: [stats.counts.Normal, stats.counts.Imbalance, stats.counts["Bearing Fault"], stats.counts.Overheating],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      hoverOffset: 20,
      borderWidth: 0
    }]
  };

  return (
    <div style={{ ...fontStyle, padding: "24px", color: currentTheme.textColor, animation: "fadeIn 0.5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", margin: 0, letterSpacing: "-0.04em" }}>
                Diagnostic Summary
            </h2>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.95rem", fontWeight: "500" }}>
                Multimodal Fusion Engine: <span style={{ color: currentTheme.textColor }}>{stats.total.toLocaleString()} Records</span>
            </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px" }}>
        {/* CHART SECTION */}
        <div style={{ 
          background: currentTheme.cardBg, 
          padding: "48px", 
          borderRadius: "32px", 
          border: `1px solid ${currentTheme.border}`, 
          height: "420px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}>
          {stats.total > 0 ? (
            <Pie data={chartData} options={{ 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            color: "#94a3b8", 
                            padding: 24, 
                            font: { family: fontStyle.fontFamily, size: 13, weight: '600' },
                            usePointStyle: true
                        } 
                    } 
                } 
            }} />
          ) : (
            <div style={{ textAlign: "center", paddingTop: "120px", color: "#64748b", fontWeight: "600" }}>
                Initializing Data Fusion...
            </div>
          )}
        </div>

        {/* CARDS SECTION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <StatCard label="Normal" val={stats.counts.Normal} total={stats.total} color="#10b981" icon={<CheckCircle2 size={20}/>} currentTheme={currentTheme} />
          <StatCard label="Imbalance" val={stats.counts.Imbalance} total={stats.total} color="#f59e0b" icon={<Activity size={20}/>} currentTheme={currentTheme} />
          <StatCard label="Bearing Fault" val={stats.counts["Bearing Fault"]} total={stats.total} color="#ef4444" icon={<AlertTriangle size={20}/>} currentTheme={currentTheme} />
          <StatCard label="Overheating" val={stats.counts.Overheating} total={stats.total} color="#8b5cf6" icon={<Thermometer size={20}/>} currentTheme={currentTheme} />
          
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.8rem", fontWeight: "600" }}>
            <Database size={14} /> 
            <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Fused Analytics System v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, val, total, color, icon, currentTheme }) => (
  <div style={{ 
    display: "flex", justifyContent: "space-between", alignItems: "center", 
    padding: "20px 28px", background: currentTheme.cardBg, borderRadius: "20px", border: `1px solid ${currentTheme.border}`,
    transition: "transform 0.2s ease"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ color, display: "flex" }}>{icon}</div>
      <span style={{ fontWeight: "600", fontSize: "1rem" }}>{label}</span>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontWeight: "800", fontSize: "1.35rem", lineHeight: "1" }}>{val.toLocaleString()}</div>
      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", marginTop: "4px" }}>
        {total > 0 ? ((val/total)*100).toFixed(1) : 0}%
      </div>
    </div>
  </div>
);