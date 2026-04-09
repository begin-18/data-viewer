import React, { useEffect, useMemo, useState, useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TableView from "./components/TableView";
import FaultSummary from "./components/FaultSummary";
import About from "./components/About";
import DataUploadPage from "./components/DataUploadZone";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";

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
  const [isDashboardCleared, setIsDashboardCleared] = useState(false);

  const [latestData, setLatestData] = useState({ vibration: null, acoustic: null, thermal: null, global: null });
  const [chartLogs, setChartLogs] = useState({ Vibration: [], Acoustic: [], Thermal: [] });
  const isFetching = useRef(false);

  const currentTheme = { background:"#0f172a", headerBg:"#111827", sidebarBg:"#1e293b", border:"#334155", textColor:"#f9fafb", cardBg:"#1e293b" };

  const btnStyle = { padding:"6px 12px", borderRadius:6, border:"1px solid #2563eb", background:"#2563eb", color:"#fff", cursor:"pointer", fontWeight:600 };

  const handleClearData = async () => {
    if (!window.confirm("Permanently delete all data from Google Sheets?")) return;
    try {
      const res = await fetch('https://thesis-backend-aukn.onrender.com/api/clear-sheets', { 
  method: 'POST' 
});
      if (res.ok) {
        setIsDashboardCleared(true);
        setLatestData({ vibration: null, acoustic: null, thermal: null, global: null });
        setChartLogs({ Vibration: [], Acoustic: [], Thermal: [] });
        setAllRows([]);
        setMergedRows([]);
        await fetchAll();
        await fetchDashboardData();
      }
    } catch (err) { console.error("Clear Failed:", err); }
  };

  const handleNewUpload = async () => {
    setIsDashboardCleared(false);
    await fetchAll();
    await fetchDashboardData();
    setActiveTab("Dashboard");
  };

  async function fetchSheetTab(tabName) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&cacheBust=${Date.now()}`;
      const res = await fetch(url);
      const text = await res.text();
      return parseGvizText(text);
    } catch { return []; }
  }

  async function fetchDashboardData() {
  if (isDashboardCleared) return;
  try {
    // Fixed: Using exact tab names from your Google Sheet
    const tabs = ["Vibration", "Acoustic", "Thermal"];
    const results = await Promise.all(tabs.map(async (tabName) => {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&cacheBust=${Date.now()}`;
      const res = await fetch(url);
      const text = await res.text();
      const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const json = JSON.parse(jsonString);
      return { tabName, rows: json.table.rows || [] };
    }));

    const newLatest = {};
    const newLogs = { Vibration: [], Acoustic: [], Thermal: [] };

    results.forEach(({ tabName, rows }) => {
      // Map "Vibration Data" back to "Vibration" for component state
      const key = tabName.split(" ")[0]; 
      
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1].c;
        const getValue = (idx) => lastRow[idx] ? lastRow[idx].v : null;
        
        newLatest[key.toLowerCase()] = {
          Timestamp: getValue(0),
          RMS: parseFloat(getValue(1)) || 0,
          Kurtosis: parseFloat(getValue(2)) || 0,
          Skewness: parseFloat(getValue(3)) || 0,
          Peak_Amplitude: parseFloat(getValue(4)) || 0,
          Temperature: parseFloat(getValue(5)) || 0,
          Status: (getValue(6) || "").toString().trim(),
          Filename: getValue(7) || "",
          _tab: key.toLowerCase()
        };

        if (key === "Thermal") {
          newLogs[key] = rows.slice(-1).map(r => parseFloat(r.c[5]?.v) || 0);
        } else {
          const latestValue = parseFloat(lastRow[2]?.v) || 1 ; 
          const instantWave = Array.from({ length: 250 }, (_, i) => {
            return latestValue * Math.sin(i * 1.2); 
          });
          newLogs[key] = instantWave;
        }
      } else {
        // ADDED: Clear data explicitly if the rows are empty
        newLatest[key.toLowerCase()] = null;
        newLogs[key] = [];
      }
    });
    setLatestData({...newLatest});
    setChartLogs({...newLogs});
  } catch (err) { console.error(err); }
}

  async function fetchAll() {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      const tabs = ["Thermal Data","Acoustic Data","Vibration Data"];
      const results = await Promise.all(tabs.map(fetchSheetTab));
      const normalized = [];
      results.forEach((rowsForTab, idx) => {
        const tab = tabs[idx];
        const cfg = TAB_CONFIG[tab];
        rowsForTab.forEach((r, i) => {
          const rawTs = pick(r,["timestamp","time","date"]);
          const {date:ts_date, time:ts_time} = normalizeTimestampToParts(rawTs);
          const timestamp = `${ts_date} / ${ts_time}`;
          let rowObj = { _tab:tab, _idx:`${tab}#${i}`, timestamp, ts_date, ts_time, fault_type: pick(r, ["fault_type","fault"]) };
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
      const mergedMap = new Map();
      normalized.forEach(r => {
        if (!mergedMap.has(r.timestamp)) mergedMap.set(r.timestamp, { timestamp: r.timestamp });
        Object.assign(mergedMap.get(r.timestamp), r);
      });
      setAllRows(normalized);
      setMergedRows(Array.from(mergedMap.values()));
    } catch(err) { console.error(err); } finally { setLoading(false); isFetching.current = false; }
  }

  useEffect(() => {
    fetchAll(); fetchDashboardData();
    const interval = setInterval(() => { fetchAll(); fetchDashboardData(); }, 2000);
    return () => clearInterval(interval);
  }, [isDashboardCleared]);

  const rows = useMemo(() => {
    if (["Dashboard", "Data Upload", "About", "Fault Summary"].includes(activeTab)) return [];
    if (activeTab === "Vibration × Acoustic × Thermal" || activeTab === "All Data" || activeTab.includes("×")) return mergedRows;
    return allRows.filter(r => r._tab === activeTab);
  }, [allRows, mergedRows, activeTab]);

  const displayCols = useMemo(() => {
    const custom = {
      "Vibration × Acoustic": ["timestamp","vibration_x","vibration_y","vibration_z","acoustic_level","fault_type"],
      "Vibration × Thermal": ["timestamp","vibration_x","vibration_y","vibration_z","temperature","fault_type"],
      "Vibration × Acoustic × Thermal": ["timestamp","temperature","acoustic_level","vibration_x","vibration_y","vibration_z","fault_type"],
      "All Data": ["timestamp","temperature","acoustic_level","vibration_x","vibration_y","vibration_z","fault_type"],
    };
    return custom[activeTab] || TAB_CONFIG[activeTab]?.displayColumns || ["timestamp","fault_type"];
  }, [activeTab]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/viewer" element={
          <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:currentTheme.background, color:currentTheme.textColor }}>
            <Header theme={theme} setTheme={setTheme} currentTheme={currentTheme} latestData={latestData.global} />
            <div style={{ display:"flex", flex:1, padding:18, gap:14 }}>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setCurrentPage={setCurrentPage} currentTheme={currentTheme} />
              <main style={{ flex:1, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
                {activeTab === "Dashboard" && (
                  <Dashboard latestData={latestData} chartLogs={chartLogs} allRows={allRows} onClearData={handleClearData} />
                )}
                {[ "Thermal Data","Acoustic Data","Vibration Data","All Data","Vibration × Acoustic","Vibration × Thermal","Vibration × Acoustic × Thermal" ].includes(activeTab) && (
                  <TableView pageRows={rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)} displayCols={displayCols} currentPage={currentPage} pageSize={pageSize} totalPages={Math.max(1, Math.ceil(rows.length / pageSize))} setCurrentPage={setCurrentPage} setPageSize={setPageSize} fetchAll={fetchAll} currentTheme={currentTheme} btnStyle={btnStyle} />
                )}
                {activeTab === "Data Upload" && <DataUploadPage onNavigate={setActiveTab} onUploadSuccess={handleNewUpload} />}
                {activeTab === "Fault Summary" && <FaultSummary thermalData={allRows.filter(r => r._tab === "Thermal Data")} acousticData={allRows.filter(r => r._tab === "Acoustic Data")} vibrationData={allRows.filter(r => r._tab === "Vibration Data")} currentTheme={currentTheme} />}
                {activeTab === "About" && <About currentTheme={currentTheme} />}
              </main>
            </div>
          </div>
      } />
    </Routes>
  );
}