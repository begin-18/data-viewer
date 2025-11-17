import React from "react";

export default function About({ currentTheme }) {
  return (
    <div style={{
      flex: "1 1 auto",
      padding: "40px 30px",
      background: currentTheme.background,
      color: currentTheme.textColor,
      fontFamily: "'Inter', sans-serif",
      lineHeight: 1.2,
      overflowY: "auto",
      height: "100vh"
    }}>
      {/* Main Title */}
      <h1 style={{
        fontSize: "2rem",
        fontWeight: 800,
        marginBottom: 8,
        letterSpacing: "1px",
        color: "#1e3a8a"
      }}>
        Multimodal Deep Learning Fusion
      </h1>

      {/* Subtitle */}
      <h2 style={{
        fontSize: "1.2rem",
        fontWeight: 600,
        marginBottom: 24,
        color: "#2563eb",
        letterSpacing: "0.5px",
      }}>
        For Rotating Equipment Anomaly Detection
      </h2>

      {/* Section 1: Overview */}
      <section style={{ marginBottom: 0 }}>
        <h3 style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid #2563eb50`,
          display: "inline-block",
          paddingBottom: 2,
          color: "#1d4ed8"
        }}>
          Overview
        </h3>
        <p style={{ fontSize: "0.95rem", marginBottom: 6 }}>
          This web application integrates multiple sensor modalities for detecting anomalies in rotating machinery using advanced deep learning fusion techniques. It processes thermal, acoustic, and vibration data in real-time to provide accurate fault detection and severity analysis.
        </p>
        <p style={{ fontSize: "0.95rem" }}>
          The platform emphasizes clarity and actionable insights, helping engineers and operators stay ahead of potential failures with precise and visual data analytics.
        </p>
      </section>

      {/* Section 2: Benefits */}
      <section style={{ marginBottom: 0 }}>
        <h3 style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid #2563eb50`,
          display: "inline-block",
          paddingBottom: 2,
          color: "#1d4ed8"
        }}>
          Benefits
        </h3>
        <ul style={{
          fontSize: "0.95rem",
          paddingLeft: 20,
          listStyleType: "disc"
        }}>
          <li>Gain actionable insights into equipment health</li>
          <li>Quickly identify potential failures and reduce downtime</li>
          <li>Proactive maintenance decisions to save costs</li>
          <li>Clear visualization of severity and alerts</li>
        </ul>
      </section>

      {/* Section 3: Key Features */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid #2563eb50`,
          display: "inline-block",
          paddingBottom: 2,
          color: "#1d4ed8"
        }}>
          Key Features
        </h3>
        <ul style={{
          fontSize: "0.95rem",
          paddingLeft: 20,
          listStyleType: "circle"
        }}>
          <li>Real-time monitoring of thermal, acoustic, and vibration data</li>
          <li>Severity visualization with color-coded alerts</li>
          <li>Fault detection and predictive insights</li>
          <li>Interactive data tables and dynamic charts</li>
          <li>Cross-modal comparative analysis for better understanding</li>
          <li>Clean and professional UI for easy navigation</li>
        </ul>
      </section>

      {/* Footer */}
      <div style={{ marginTop: 40, fontSize: "0.85rem", color: "#6b7280" }}>
        © 2025 Multimodal Anomaly Detection System. All rights reserved.
      </div>
    </div>
  );
}
