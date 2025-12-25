// SheetViewerMultiPaginated.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TableView from "./components/TableView";
import GraphView from "./components/GraphView";
import FaultSummary from "./components/FaultSummary";
import About from "./components/About";
// IMPORT NEW UPLOAD PAGE COMPONENT
import DataUploadPage from "./components/DataUploadZone"; 
import { parseGvizText, pick, normalizeTimestampToParts } from "./utils";
import { FiActivity, FiCheckCircle, FiThermometer } from "react-icons/fi";

ChartJS.register(ArcElement, Tooltip, Legend);

const SHEET_ID = "1wDkNRGrKvYehMI4f8Ks4RLoncGHrs7xWDg8Dy2d5Tk8";
const POLL_MS = 0;
const DEFAULT_PAGE_SIZE = 100;

const TAB_CONFIG = {
  "Thermal Data": { valueKeys: ["temperature","temp","temp_c","temperature_c","temperature (c)"], displayColumns: ["timestamp","temperature","fault_type"] },
  "Acoustic Data": { valueKeys: ["acoustic_level","acoustic level","level","acoustic","acoustic_level_db","level_db"], displayColumns: ["timestamp","acoustic_level","fault_type"] },
  "Vibration Data": { 
    vibXKeys:["vibration_x","vibration x","vibrationx","vib_x","vibx","x"],
    vibYKeys:["vibration_y","vibration y","vibrationy","vib_y","viby","y"],
    vibZKeys:["vibration_z","vibration z","vibrationz","vib_z","vibz","z"],
    displayColumns:["timestamp","vibration_x","vibration_y","vibration_z","fault_type"]
  }
};

// Main component
export default function SheetViewerMultiPaginated() {
  const [allRows,setAllRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [activeTab,setActiveTab] = useState("Thermal Data"); 
  const [pageSize,setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage,setCurrentPage] = useState(1);
  const [theme,setTheme] = useState("light");

  const themes = {
    light: {
      background:"#f7f8fa", headerBg:"#fff", sidebarBg:"#f9fafb",
      tableBg:"#fff", tableHeader:"#f3f4f6", tableText:"#111827",
      border:"#e5e7eb", cardBg:"#fff", cardShadow:"0 6px 16px rgba(0,0,0,0.08)", textColor:"#111827"
    },
    dark: {
      background:"#1f2937", headerBg:"#111827", sidebarBg:"#1e293b",
      tableBg:"#111827", tableHeader:"#1e293b", tableText:"#f9fafb",
      border:"#374151", cardBg:"#1e293b", cardShadow:"0 6px 16px rgba(0,0,0,0.3)", textColor:"#f9fafb"
    }
  };

  const currentTheme = themes[theme];

  const btnStyle = {
    padding:"6px 12px", borderRadius:6, border:"1px solid #2563eb", background:"#2563eb",
    color:"#fff", cursor:"pointer", fontWeight:600, transition:"all 0.2s"
  };

  // Fetch sheet tab
  async function fetchSheetTab(tabName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
    const res = await fetch(url);
    const text = await res.text();
    return parseGvizText(text);
  }

  // Fetch all tabs
  async function fetchAll() {
    setLoading(true);
    try {
      const tabs = ["Thermal Data","Acoustic Data","Vibration Data"];
      const promises = tabs.map(t => fetchSheetTab(t).catch(()=>[]));
      const results = await Promise.all(promises);
      const normalized = [];
      results.forEach((rowsForTab,idx)=>{
        const tab = tabs[idx]; const cfg = TAB_CONFIG[tab]||{};
        rowsForTab.forEach((r,i)=>{
          const rawTs = pick(r,["timestamp","time","datetime","date_time","date"]);
          const {date:ts_date,time:ts_time} = normalizeTimestampToParts(rawTs);
          const timestamp = `${ts_date} / ${ts_time}`;
          const fault_type = pick(r, ["fault_type","fault type","fault","faulttype","fault-type"]);
          if(tab==="Thermal Data"){
            normalized.push({_tab:tab,_idx:`${tab}#${i}`,timestamp,ts_date,ts_time,temperature:pick(r,cfg.valueKeys||[]),fault_type,_raw:r});
          } else if(tab==="Acoustic Data"){
            normalized.push({_tab:tab,_idx:`${tab}#${i}`,timestamp,ts_date,ts_time,acoustic_level:pick(r,cfg.valueKeys||[]),fault_type,_raw:r});
          } else if(tab==="Vibration Data"){
            normalized.push({_tab:tab,_idx:`${tab}#${i}`,timestamp,ts_date,ts_time,vibration_x:pick(r,cfg.vibXKeys||[]),vibration_y:pick(r,cfg.vibYKeys||[]),vibration_z:pick(r,cfg.vibZKeys||[]),fault_type,_raw:r});
          }
        });
      });

      // Merge rows by timestamp for comparisons
      const mergedByTimestamp = {};
      normalized.forEach(r=>{
        if(!mergedByTimestamp[r.timestamp]) mergedByTimestamp[r.timestamp]={timestamp:r.timestamp};
        if(r._tab==="Thermal Data") mergedByTimestamp[r.timestamp].temperature = r.temperature;
        if(r._tab==="Acoustic Data") mergedByTimestamp[r.timestamp].acoustic_level = r.acoustic_level;
        if(r._tab==="Vibration Data"){
          mergedByTimestamp[r.timestamp].vibration_x = r.vibration_x;
          mergedByTimestamp[r.timestamp].vibration_y = r.vibration_y;
          mergedByTimestamp[r.timestamp].vibration_z = r.vibration_z;
        }
        // optional: keep latest fault_type
        mergedByTimestamp[r.timestamp].fault_type = r.fault_type || mergedByTimestamp[r.timestamp].fault_type;
      });

      setAllRows(normalized);
      setCurrentPage(1);
      setMergedRows(Object.values(mergedByTimestamp));
    } catch(err){ console.error(err); setAllRows([]); setMergedRows([]); }
    finally { setLoading(false); }
  }

  const [mergedRows,setMergedRows] = useState([]);

  useEffect(()=>{
    fetchAll();
    if(POLL_MS>0){ const id=setInterval(fetchAll,POLL_MS); return()=>clearInterval(id); }
  },[]);

  // ---------- Prepare rows for table ----------
  const rows = useMemo(()=>{
    // Check if we are on the data upload tab; if so, return an empty array
    if (activeTab === "Data Upload & Processing") return []; 
    
    if(activeTab==="Vibration × Acoustic"){
      return mergedRows.map(r=>({
        timestamp:r.timestamp,
        vibration_x:r.vibration_x, vibration_y:r.vibration_y, vibration_z:r.vibration_z,
        acoustic_level:r.acoustic_level, fault_type:r.fault_type
      }));
    }
    if(activeTab==="Vibration × Thermal"){
      return mergedRows.map(r=>({
        timestamp:r.timestamp,
        vibration_x:r.vibration_x, vibration_y:r.vibration_y, vibration_z:r.vibration_z,
        temperature:r.temperature, fault_type:r.fault_type
      }));
    }
    if(activeTab==="Vibration × Acoustic × Thermal"){
      return mergedRows.map(r=>({
        timestamp:r.timestamp,
        vibration_x:r.vibration_x, vibration_y:r.vibration_y, vibration_z:r.vibration_z,
        acoustic_level:r.acoustic_level, temperature:r.temperature, fault_type:r.fault_type
      }));
    }
    if(activeTab==="All Data") return mergedRows;
    return allRows.filter(r=>r._tab===activeTab);
  },[allRows,mergedRows,activeTab]);

  const totalPages = Math.max(1, Math.ceil(rows.length/pageSize));
  useEffect(()=>{ if(currentPage>totalPages)setCurrentPage(totalPages); if(currentPage<1)setCurrentPage(1); },[totalPages,currentPage]);
  const pageRows = useMemo(()=>rows.slice((currentPage-1)*pageSize,(currentPage-1)*pageSize+pageSize),[rows,currentPage,pageSize]);

  // Display columns for each comparison tab
  const displayCols = useMemo(()=>{
    if(activeTab==="Vibration × Acoustic") return ["timestamp","vibration_x","vibration_y","vibration_z","acoustic_level","fault_type"];
    if(activeTab==="Vibration × Thermal") return ["timestamp","vibration_x","vibration_y","vibration_z","temperature","fault_type"];
    if(activeTab==="Vibration × Acoustic × Thermal") return ["timestamp","vibration_x","vibration_y","vibration_z","acoustic_level","temperature","fault_type"];
    if(activeTab==="All Data") return ["timestamp","temperature","acoustic_level","vibration_x","vibration_y","vibration_z","fault_type"];
    return TAB_CONFIG[activeTab]?.displayColumns||["timestamp","value","fault_type"];
  },[activeTab]);

  const faultCounts = useMemo(()=>{
    const counts={};
    ["Thermal Data","Acoustic Data","Vibration Data"].forEach(tab=>{
      const tabRows = allRows.filter(r=>r._tab===tab);
      counts[tab]={Imbalance:0,"Bearing Fault":0,Overheating:0,Normal:0};
      tabRows.forEach(r=>{
        const ft = (r.fault_type||"").toLowerCase();
        if(!ft) return;
        if(ft.includes("imbalance")) counts[tab]["Imbalance"]++;
        else if(ft.includes("bearing")) counts[tab]["Bearing Fault"]++;
        else if(ft.includes("overheat")) counts[tab]["Overheating"]++;
        else if(ft.includes("normal")) counts[tab]["Normal"]++;
      });
    });
    return counts;
  },[allRows]);

  const iconMap = { "Thermal Data":<FiThermometer size={20}/>, "Acoustic Data":<FiCheckCircle size={20}/>, "Vibration Data":<FiActivity size={20}/> };

  return (
    <div style={{fontFamily:"Inter,system-ui,Arial",height:"100vh",overflow:"hidden",display:"flex",flexDirection:"column",background:currentTheme.background,color:currentTheme.textColor}}>
      <Header theme={theme} setTheme={setTheme} currentTheme={currentTheme} />
      <div style={{display:"flex",flex:"1 1 auto",gap:14,padding:18}}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setCurrentPage={setCurrentPage} 
          currentTheme={currentTheme}
          comparisonTabs={[
            "Vibration × Acoustic",
            "Vibration × Thermal",
            "Vibration × Acoustic × Thermal"
          ]}
        />
        <main style={{flex:"1 1 auto",display:"flex",flexDirection:"column",gap:12}}>
          
          {/* RENDER DATA UPLOAD PAGE */}
          {activeTab === "Data Upload" && (
            <DataUploadPage currentTheme={currentTheme} />
          )}

          {/* RENDER TABLE VIEW (Only show TableView if activeTab is a data or comparison view) */}
          {["Thermal Data","Acoustic Data","Vibration Data","All Data","Vibration × Acoustic","Vibration × Thermal","Vibration × Acoustic × Thermal"].includes(activeTab) && (
            <TableView
              pageRows={pageRows}
              displayCols={displayCols}
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              pageSizeValue={pageSize}
              setPageSize={setPageSize}
              fetchAll={fetchAll}
              currentTheme={currentTheme}
              btnStyle={btnStyle}
            />
          )}
          
          {/* RENDER OTHER VIEWS */}
          {activeTab==="Graph" && <GraphView faultCounts={faultCounts} currentTheme={currentTheme} />}
          {activeTab==="Fault Summary" && <FaultSummary faultCounts={faultCounts} theme={theme} currentTheme={currentTheme} />}
          {activeTab==="About" && <About currentTheme={currentTheme} />}
        </main>
      </div>
    </div>
  );
}