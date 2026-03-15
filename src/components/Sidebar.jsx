import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Database, BarChart3, AlertTriangle, Settings, UserCircle, Target, Layers } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, currentTheme, isUserAdmin }) {
  const mainTabs = ["Dashboard", "Data Logs", "Analyses", "Fault Summary", "Data Upload", "Settings"];
  
  const subTabsDataLogs = ["Thermal Data", "Acoustic Data", "Vibration Data"];
  
  // These must match the strings in your SheetViewer logic exactly
  const subTabsComparisons = [
    "Vibration × Acoustic", 
    "Vibration × Thermal", 
    "Vibration × Acoustic × Thermal"
  ];

  const [openSubMenu, setOpenSubMenu] = useState(null); 

  const linkButtonStyle = (tab, isSubItem = false) => ({
    width: "100%",
    padding: isSubItem ? "10px 15px 10px 40px" : "12px 15px",
    textAlign: "left",
    borderRadius: 8,
    border: activeTab === tab ? `2px solid #2563eb` : `1px solid transparent`,
    background: activeTab === tab ? "#2563eb20" : "transparent",
    cursor: "pointer",
    fontWeight: activeTab === tab ? 700 : 500,
    color: activeTab === tab ? "#2563eb" : currentTheme.textColor,
    transition: "all 0.2s",
    fontSize: isSubItem ? 13 : 15,
    display: "flex",
    alignItems: "center",
    gap: isSubItem ? 8 : 12,
    textDecoration: "none",
    marginBottom: 2
  });

  const handleSubTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <aside style={{
      width: 260,
      flex: "0 0 260px",
      display: "flex",
      flexDirection: "column",
      padding: "20px 15px",
      backgroundColor: currentTheme.sidebarBg,
      borderRight: `1px solid ${currentTheme.border}`,
      height: "100vh",
      position: "sticky",
      top: 0,
      overflowY: "auto"
    }}>
      {/* Brand */}
    

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {mainTabs.map(tab => (
          <div key={tab}>
            
            {/* 1. DATA LOGS DROPDOWN */}
            {tab === "Data Logs" ? (
              <div>
                <button 
                  onClick={() => setOpenSubMenu(openSubMenu === "Logs" ? null : "Logs")} 
                  style={linkButtonStyle(tab)}
                >
                  <Database size={18}/>
                  <span>{tab}</span>
                  <span style={{ fontSize: 10, marginLeft: "auto" }}>{openSubMenu === "Logs" ? "▲" : "▼"}</span>
                </button>
                {openSubMenu === "Logs" && (
                  <div style={{ marginTop: 2, display: "flex", flexDirection: "column" }}>
                    {subTabsDataLogs.map(sub => (
                      <button key={sub} onClick={() => handleSubTabClick(sub)} style={linkButtonStyle(sub, true)}>
                         <Target size={14}/> {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) 

            /* 2. ANALYSES / COMPARATIVE ANALYSIS DROPDOWN */
            : tab === "Analyses" ? (
              <div>
                <button 
                  onClick={() => setOpenSubMenu(openSubMenu === "Analyses" ? null : "Analyses")} 
                  style={linkButtonStyle(tab)}
                >
                  <BarChart3 size={18}/>
                  <span>Comparative</span>
                  <span style={{ fontSize: 10, marginLeft: "auto" }}>{openSubMenu === "Analyses" ? "▲" : "▼"}</span>
                </button>
                {openSubMenu === "Analyses" && (
                  <div style={{ marginTop: 2, display: "flex", flexDirection: "column" }}>
                    {subTabsComparisons.map(sub => (
                      <button key={sub} onClick={() => handleSubTabClick(sub)} style={linkButtonStyle(sub, true)}>
                         <Layers size={14}/> {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )

            /* 3. STANDARD TABS */
            : (
              <button onClick={() => setActiveTab(tab)} style={linkButtonStyle(tab)}>
                {tab === "Dashboard" && <LayoutDashboard size={18}/>}
                {tab === "Fault Summary" && <AlertTriangle size={18}/>}
                {tab === "Data Upload" && <Target size={18}/>}
                {tab === "Settings" && <Settings size={18}/>}
                <span>{tab}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Admin Footer */}
      {isUserAdmin && (
        <div style={{ borderTop: `1px solid ${currentTheme.border}`, paddingTop: 20 }}>
          <button style={linkButtonStyle("User Account")}>
            <UserCircle size={18}/>
            <span>Admin User</span>
          </button>
        </div>
      )}
    </aside>
  );
}