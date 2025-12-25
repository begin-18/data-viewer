import React from "react";

export default function About({ currentTheme }) {
  
  const primaryColor = "#1D4ED8"; 
  const accentColor = "#3B82F6";
  const secondaryTextColor = "#6B7280";
  
  
  const containerStyle = {
    flex: "1 1 auto",
    padding: "60px 80px", // Spacious padding retained
    paddingBottom: "100px", // Extra space at the bottom (scrollable content)
    background: currentTheme.background,
    color: currentTheme.textColor,
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
    
    // 👇 Key styles to enable internal scroll 👇
    maxHeight: "85vh", // Define a fixed height relative to the viewport
    overflowY: "auto",  // Enable vertical scrolling if content exceeds maxHeight
    // 👆 Key styles to enable internal scroll 👆
  };

  // --- Typography Styles (Unchanged) ---

  const h1Style = {
    fontSize: "3rem",
    fontWeight: 800,
    marginBottom: 0,
    letterSpacing: "-0.02em",
    color: primaryColor,
  };

  const h2Style = {
    fontSize: "1.5rem",
    fontWeight: 500,
    marginTop: 8,
    marginBottom: 40,
    color: accentColor,
    letterSpacing: "0em",
  };

  const h3Style = {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: 16,
    paddingBottom: 4,
    borderBottom: `2px solid ${accentColor}30`,
    display: "block",
    color: primaryColor,
    marginTop: 40,
  };

  const pStyle = {
    fontSize: "1.05rem",
    marginBottom: 16,
    color: currentTheme.textColor,
  };

  const listStyle = {
    fontSize: "1.05rem",
    paddingLeft: 24,
    listStyleType: "disc",
    lineHeight: 1.8,
  };

  // --- Component JSX ---

  return (
    <div style={containerStyle}>
      {/* Main Title Block */}
      <h1 style={h1Style}>
        Multimodal Deep Learning Fusion
      </h1>
      <h2 style={h2Style}>
        Next-Generation Anomaly Detection for Rotating Equipment
      </h2>

      {/* Section 1: Overview */}
      <section>
        <h3 style={h3Style}>
          🚀 Platform Overview
        </h3>
        <p style={pStyle}>
          This platform utilizes state-of-the-art deep learning fusion models to integrate and analyze data from multiple sensor modalities—specifically <strong>thermal, acoustic, and vibration</strong> sources. This synergy provides a robust, holistic view of machine health, far surpassing the accuracy of single-modal systems.
        </p>
        <p style={pStyle}>
          Our primary goal is to shift maintenance from reactive to truly <strong>predictive</strong>, offering engineers actionable intelligence in real-time. This emphasis on precise, visually-driven analytics ensures optimal operational efficiency and extended asset life.
        </p>
      </section>

      {/* Section 2: Core Advantages */}
      <section>
        <h3 style={h3Style}>
          💡 Core Advantages
        </h3>
        <ul style={{ ...listStyle, listStyleType: "square" }}>
          <li>
            <strong>Maximized Uptime:</strong> Proactive fault detection minimizes catastrophic failures and unplanned downtime.
          </li>
          <li>
            <strong>Data Synergy:</strong> Deep learning fusion extracts subtle patterns that are invisible to traditional monitoring methods.
          </li>
          <li>
            <strong>Cost Reduction:</strong> Optimized maintenance scheduling based on <strong>Actual Remaining Useful Life (RUL)</strong>.
          </li>
          <li>
            <strong>Intuitive Dashboards:</strong> Clear, color-coded severity metrics for rapid decision-making.
          </li>
        </ul>
      </section>

      {/* Section 3: Technical Features */}
      <section style={{ marginBottom: 60 }}>
        <h3 style={h3Style}>
          ⚙️ Key Technical Features
        </h3>
        <ul style={{ ...listStyle, listStyleType: "circle" }}>
          <li>
            <strong>Real-time Sensor Aggregation:</strong> Continuous, synchronized monitoring across all three modalities.
          </li>
          <li>
            <strong>Severity Mapping:</strong> Dynamic visualization of fault intensity and location within the equipment.
          </li>
          <li>
            <strong>Time-Series Analysis:</strong> Advanced predictive insights based on evolving failure patterns.
          </li>
          <li>
            <strong>Cross-Modal Validation:</strong> Utilizing one data stream to validate anomalies detected in another, drastically reducing false positives.
          </li>
          <li>
            <strong>Professional UX:</strong> Clean, responsive interface optimized for both desktop and mobile operations.
          </li>
        </ul>
      </section>

      {/* Footer */}
      <div style={{ 
        marginTop: 60, 
        paddingTop: 20, 
        borderTop: `1px solid ${secondaryTextColor}20`,
        fontSize: "0.9rem", 
        color: secondaryTextColor,
        textAlign: "left"
      }}>
        © 2025 Multimodal Anomaly Detection System. All rights reserved. | Built with Deep Learning Fusion.
      </div>
    </div>
  );
} 