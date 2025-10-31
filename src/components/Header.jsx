import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function Header({ theme, setTheme, currentTheme }) {
  return (
    <header style={{
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 18px",
      borderBottom: `1px solid ${currentTheme.border}`,
      background: currentTheme.headerBg,
      flex: "0 0 auto"
    }}>
      <h1 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>Feature Data</h1>
      <button onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
        style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "transparent", color: currentTheme.textColor, fontSize: 18, cursor: "pointer" }}>
        {theme === "light" ? <FiMoon /> : <FiSun />}
      </button>
    </header>
  );
}
