import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar({ activeTab, setActiveTab, setCurrentPage, currentTheme }) {
  const mainTabs = ["Data Overview", "Comparative Analysis", "Fault Summary", "About"];
  const subTabsAllData = ["Thermal Data", "Acoustic Data", "Vibration Data"];
  const subTabsComparisons = [
    "Vibration × Acoustic",
    "Vibration × Thermal",
    "Vibration × Acoustic × Thermal"
  ];

  const [activeSubTab, setActiveSubTab] = useState(subTabsAllData[0]);
  const [allDataOpen, setAllDataOpen] = useState(false);
  const [comparisonsOpen, setComparisonsOpen] = useState(false);

  const handleSubTabClick = (tab) => {
    setActiveSubTab(tab);
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <aside style={{
      width: 210,
      flex: "0 0 220px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      overflowY: "auto",
      borderRight: `1px solid ${currentTheme.border}`,
      background: currentTheme.sidebarBg,
      borderRadius: 12,
      padding: "12px 0"
    }}>
      {/* Main Tabs */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {mainTabs.map(tab => (
          <div key={tab}>
            <button
              onClick={() => {
                if(tab === "Data Overview") {
                  setAllDataOpen(prev => !prev);
                  setComparisonsOpen(false);
                  setActiveTab(activeSubTab);
                  setCurrentPage(1);
                } else if(tab === "Comparative Analysis") {
                  setComparisonsOpen(prev => !prev);
                  setAllDataOpen(false);
                  setActiveTab(activeSubTab);
                  setCurrentPage(1);
                } else {
                  setAllDataOpen(false);
                  setComparisonsOpen(false);
                  setActiveTab(tab);
                  setCurrentPage(1);
                }
              }}
              style={{
                width: "95%",
                padding: "16px 15px",
                textAlign: "right",
                borderRadius: 12,
                border: activeTab === tab ? `2px solid #2563eb` : `1px solid ${currentTheme.border}`,
                background: activeTab === tab ? "#2563eb20" : currentTheme.sidebarBg,
                cursor: "pointer",
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? "#1d4ed8" : currentTheme.textColor,
                transition: "all 0.2s",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>{tab}</span>
              {(tab === "Data Overview" || tab === "Comparative Analysis") && (
                <span>{(tab === "Data Overview" ? allDataOpen : comparisonsOpen) ? "▲" : "▼"}</span>
              )}
            </button>

            {/* Data Overview sub-tabs */}
            {tab === "Data Overview" && allDataOpen && (
              <div style={{ position: "relative", marginLeft: 12, marginTop: 6 }}>
                <div style={{
                  position: "absolute",
                  left: 8,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: "#2563eb50",
                  borderRadius: 1
                }}></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16 }}>
                  {subTabsAllData.map(sub => (
                    <button
                      key={sub}
                      onClick={() => handleSubTabClick(sub)}
                      style={{
                        width: "95%",
                        padding: "10px 12px",
                        textAlign: "left",
                        borderRadius: 8,
                        border: activeTab === sub ? `2px solid #2563eb` : `1px solid ${currentTheme.border}`,
                        background: activeTab === sub ? "#2563eb20" : currentTheme.sidebarBg,
                        cursor: "pointer",
                        fontWeight: activeTab === sub ? 700 : 500,
                        color: activeTab === sub ? "#1d4ed8" : currentTheme.textColor,
                        transition: "all 0.2s",
                        fontSize: 14
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comparative Analysis sub-tabs */}
            {tab === "Comparative Analysis" && comparisonsOpen && (
              <div style={{ position: "relative", marginLeft: 12, marginTop: 6 }}>
                <div style={{
                  position: "absolute",
                  left: 8,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: "#2563eb50",
                  borderRadius: 1
                }}></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16 }}>
                  {subTabsComparisons.map(sub => (
                    <button
                      key={sub}
                      onClick={() => handleSubTabClick(sub)}
                      style={{
                        width: "95%",
                        padding: "10px 12px",
                        textAlign: "left",
                        borderRadius: 8,
                        border: activeTab === sub ? `2px solid #2563eb` : `1px solid ${currentTheme.border}`,
                        background: activeTab === sub ? "#2563eb20" : currentTheme.sidebarBg,
                        cursor: "pointer",
                        fontWeight: activeTab === sub ? 700 : 500,
                        color: activeTab === sub ? "#1d4ed8" : currentTheme.textColor,
                        transition: "all 0.2s",
                        fontSize: 14
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Home button at the bottom */}
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <button style={{
            width: "95%",
            padding: "16px 15px",
            textAlign: "center",
            borderRadius: 12,
            border: activeTab === "Home" ? `2px solid #2563eb` : `1px solid ${currentTheme.border}`,
            background: activeTab === "Home" ? "#2563eb20" : currentTheme.sidebarBg,
            cursor: "pointer",
            fontWeight: activeTab === "Home" ? 700 : 500,
            color: activeTab === "Home" ? "#1d4ed8" : currentTheme.textColor,
            transition: "all 0.2s",
            fontSize: 16,
          }}>
            Home
          </button>
        </Link>
      </div>
      </nav>
    </aside>
  );
}
