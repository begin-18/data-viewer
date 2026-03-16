// SheetViewerMultiPaginated.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TableView from "./components/TableView";
import GraphView from "./components/GraphView";
import LineChart from "./components/LineChart";
import FaultSummary from "./components/FaultSummary";
import About from "./components/About";
import DataUploadPage from "./components/DataUploadZone"; 
import Dashboard from "./components/Dashboard"; 
import { parseGvizText, pick, normalizeTimestampToParts } from "./utils";

ChartJS.register(ArcElement, Tooltip, Legend);

const SHEET_ID = "1wDkNRGrKvYehMI4f8Ks4RLoncGHrs7xWDg8Dy2d5Tk8";
const DEFAULT_PAGE_SIZE = 100;

const roundTo8Decimals = (val) => {
  if (val === null || val === undefined || val === "") return "0.00000000";
  const num = parseFloat(val);
  return isNaN(num) ? val : Number(num.toFixed(8)).toString();
};

const TAB_CONFIG = {
  "Thermal Data": { valueKeys: ["temperature","temp"], displayColumns: ["timestamp","temperature","fault_type"] },
  "Acoustic Data": { valueKeys: ["acoustic_level","level"], displayColumns: ["timestamp","acoustic_level","fault_type"] },
  "Vibration Data": { 
    vibXKeys:["vibration_x","x"], vibYKeys:["vibration_y","y"], vibZKeys:["vibration_z","z"],
    displayColumns:["timestamp","vibration_x","vibration_y","vibration_z","fault_type"]
  }
};

export default function SheetViewerMultiPaginated() {
  const [allRows, setAllRows] = useState([]);
  const [mergedRows, setMergedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard"); 
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState("dark");

  const [latestData, setLatestData] = useState(null);
  const [chartLogs, setChartLogs] = useState({ Vibration: [], Acoustic: [], Thermal: [] });

  const themes = {
    light: { background:"#f7f8fa", headerBg:"#fff", sidebarBg:"#f9fafb", border:"#e5e7eb", textColor:"#111827", cardBg:"#fff" },
    dark: { background:"#0f172a", headerBg:"#111827", sidebarBg:"#1e293b", border:"#334155", textColor:"#f9fafb", cardBg:"#1e293b" }
  };
  const currentTheme = themes[theme];

  const btnStyle = {
    padding:"6px 12px", borderRadius:6, border:"1px solid #2563eb", background:"#2563eb",
    color:"#fff", cursor:"pointer", fontWeight:600
  };

  async function fetchSheetTab(tabName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&tbe=${Date.now()}`;
    const res = await fetch(url);
    const text = await res.text();
    return parseGvizText(text);
  }

 async function fetchDashboardData() {
    try {
      const tabName = "New Data Storage"; 
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&v=${Date.now()}`;
      
      const res = await fetch(url);
      if (!res.ok) return;

      const text = await res.text();
      const rows = parseGvizText(text);

      if (rows && rows.length > 0) {
        const lastRow = rows[rows.length - 1];

        setLatestData({
          Timestamp: pick(lastRow, ["timestamp", "time"]),
          RMS: parseFloat(pick(lastRow, ["rms"])) || 0,
          Kurtosis: parseFloat(pick(lastRow, ["kurtosis"])) || 0,
          Skewness: parseFloat(pick(lastRow, ["skewness"])) || 0,
          PeakAmp: parseFloat(pick(lastRow, ["peak amp", "peak_amp"])) || 0,
          Temperature: parseFloat(pick(lastRow, ["temperature", "temp"])) || 0,
          
          // ADDED ACOUSTIC MAPPING
          Acoustic: parseFloat(pick(lastRow, ["acoustic_level", "acoustic"])) || 0,
          
          "Status (0/1)": lastRow["Status"] ?? lastRow["status"]
        });

        setChartLogs({
          Vibration: rows.slice(-20).map(r => parseFloat(pick(r, ["rms"])) || 0),
          Thermal: rows.slice(-20).map(r => parseFloat(pick(r, ["temperature"])) || 0),
          // ADDED ACOUSTIC LOGS FOR THE CHART
          Acoustic: rows.slice(-20).map(r => parseFloat(pick(r, ["acoustic_level", "acoustic"])) || 0) 
        });
      }
    } catch (err) { 
      console.error("Dashboard Sync Error:", err); 
    }
  }
  async function fetchAll() {
    setLoading(true);
    try {
      const tabs = ["Thermal Data","Acoustic Data","Vibration Data"];
      const results = await Promise.all(tabs.map(t => fetchSheetTab(t).catch(()=>[])));
      const normalized = [];
      
      results.forEach((rowsForTab, idx) => {
        const tab = tabs[idx]; const cfg = TAB_CONFIG[tab];
        rowsForTab.forEach((r, i) => {
          const rawTs = pick(r,["timestamp","time","date"]);
          const {date:ts_date, time:ts_time} = normalizeTimestampToParts(rawTs);
          const timestamp = `${ts_date} / ${ts_time}`;
          const fault_type = pick(r, ["fault_type","fault"]);
          
          let rowObj = { _tab:tab, _idx:`${tab}#${i}`, timestamp, ts_date, ts_time, fault_type };
          if(tab==="Thermal Data") rowObj.temperature = roundTo8Decimals(pick(r, cfg.valueKeys));
          if(tab==="Acoustic Data") rowObj.acoustic_level = roundTo8Decimals(pick(r, cfg.valueKeys));
          if(tab==="Vibration Data") {
            rowObj.vibration_x = roundTo8Decimals(pick(r, cfg.vibXKeys));
            rowObj.vibration_y = roundTo8Decimals(pick(r, cfg.vibYKeys));
            rowObj.vibration_z = roundTo8Decimals(pick(r, cfg.vibZKeys));
          }
          normalized.push(rowObj);
        });
      });

      const merged = {};
      normalized.forEach(r => {
        if(!merged[r.timestamp]) merged[r.timestamp] = { timestamp: r.timestamp };
        Object.assign(merged[r.timestamp], r);
      });

      setAllRows(normalized);
      setMergedRows(Object.values(merged));
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchAll();
    fetchDashboardData();
    const id = setInterval(() => { fetchAll(); fetchDashboardData(); }, 30000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    if (["Dashboard", "Data Upload", "About", "Fault Summary"].includes(activeTab)) return [];
    if (activeTab === "Vibration × Acoustic") return mergedRows.map(r => ({ timestamp: r.timestamp, vibration_x: r.vibration_x, vibration_y: r.vibration_y, vibration_z: r.vibration_z, acoustic_level: r.acoustic_level, fault_type: r.fault_type }));
    if (activeTab === "Vibration × Thermal") return mergedRows.map(r => ({ timestamp: r.timestamp, vibration_x: r.vibration_x, vibration_y: r.vibration_y, vibration_z: r.vibration_z, temperature: r.temperature, fault_type: r.fault_type }));
    if (activeTab === "Vibration × Acoustic × Thermal" || activeTab === "All Data") return mergedRows;
    return allRows.filter(r => r._tab === activeTab);
  }, [allRows, mergedRows, activeTab]);

  const displayCols = useMemo(() => {
    const custom = {
      "Vibration × Acoustic": ["timestamp", "vibration_x", "vibration_y", "vibration_z", "acoustic_level", "fault_type"],
      "Vibration × Thermal": ["timestamp", "vibration_x", "vibration_y", "vibration_z", "temperature", "fault_type"],
      "All Data": ["timestamp", "temperature", "acoustic_level", "vibration_x", "vibration_y", "vibration_z", "fault_type"],
      "Vibration × Acoustic × Thermal": ["timestamp", "temperature", "acoustic_level", "vibration_x", "vibration_y", "vibration_z", "fault_type"]
    };
    return custom[activeTab] || TAB_CONFIG[activeTab]?.displayColumns || ["timestamp", "fault_type"];
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize), [rows, currentPage, pageSize]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: currentTheme.background, color: currentTheme.textColor, overflow: "hidden" }}>
      <Header theme={theme} setTheme={setTheme} currentTheme={currentTheme} />
      <div style={{ display: "flex", flex: "1", overflow: "hidden", padding: 18, gap: 14 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setCurrentPage={setCurrentPage} currentTheme={currentTheme} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {activeTab === "Dashboard" && <Dashboard latestData={latestData} chartLogs={chartLogs} currentTheme={currentTheme} />}
          {[ "Thermal Data", "Acoustic Data", "Vibration Data", "All Data", "Vibration × Acoustic", "Vibration × Thermal", "Vibration × Acoustic × Thermal" ].includes(activeTab) && (
            <TableView pageRows={pageRows} displayCols={displayCols} currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} setCurrentPage={setCurrentPage} setPageSize={setPageSize} fetchAll={fetchAll} currentTheme={currentTheme} btnStyle={btnStyle} />
          )}
          {activeTab === "Data Upload" && <DataUploadPage currentTheme={currentTheme} />}
          {activeTab === "Fault Summary" && <FaultSummary allRows={allRows} currentTheme={currentTheme} />}
          {activeTab === "About" && <About currentTheme={currentTheme} />}
        </main>
      </div>
    </div>
  );
}