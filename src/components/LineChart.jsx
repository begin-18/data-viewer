import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { parseGvizText } from "../utils"; 
import { FiRefreshCw, FiChevronLeft, FiChevronRight, FiChevronsRight, FiChevronsLeft } from "react-icons/fi";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SHEET_ID = "1wDkNRGrKvYehMI4f8Ks4RLoncGHrs7xWDg8Dy2d5Tk8";
const BLOCK_SIZE = 100; 

export default function SensorLineChart({ currentTheme }) {
  const [allData, setAllData] = useState([]); 
  const [currentPage, setCurrentPage] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatLabel = (val) => {
    const str = String(val || "");
    if (str.includes("Date(")) {
      const p = str.match(/\d+/g);
      if (p && p.length >= 5) {
        let hours = parseInt(p[3]);
        const minutes = p[4].padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
      }
    }
    return str;
  };

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const getUrl = (tab) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
      
      const [resT, resA, resV] = await Promise.all([
        fetch(getUrl("Thermal Data")),
        fetch(getUrl("Acoustic Data")),
        fetch(getUrl("Vibration Data"))
      ]);

      const [textT, textA, textV] = await Promise.all([resT.text(), resA.text(), resV.text()]);
      
      const rawT = parseGvizText(textT);
      const rawA = parseGvizText(textA);
      const rawV = parseGvizText(textV);

      const maxLength = Math.max(rawT.length, rawA.length, rawV.length);
      const merged = [];

      for (let i = 0; i < maxLength; i++) {
        merged.push({
          time: rawT[i] ? Object.values(rawT[i])[0] : (rawA[i] ? Object.values(rawA[i])[0] : ""),
          thermal: rawT[i] ? Object.values(rawT[i])[1] : 0,
          acoustic: rawA[i] ? Object.values(rawA[i])[1] : 0,
          vibration: rawV[i] ? Object.values(rawV[i])[1] : 0
        });
      }

      setAllData(merged);
      const lastPage = Math.floor((merged.length - 1) / BLOCK_SIZE);
      setCurrentPage(lastPage);
    } catch (error) {
      console.error("Multi-Sheet Fetch Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (allData.length > 0) {
      const start = currentPage * BLOCK_SIZE;
      const end = start + BLOCK_SIZE;
      const displayData = allData.slice(start, end);

      setChartData({
        labels: displayData.map(d => formatLabel(d.time)),
        datasets: [
          {
            label: "Thermal (°C)",
            data: displayData.map(d => d.thermal),
            borderColor: "#ef4444",
            yAxisID: 'y', 
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 1,
          },
          {
            label: "Acoustic (dB)",
            data: displayData.map(d => d.acoustic),
            borderColor: "#3b82f6",
            yAxisID: 'y1', 
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 1,
          },
          {
            label: "Vibration (m/s²)",
            data: displayData.map(d => d.vibration),
            borderColor: "#10b981",
            yAxisID: 'y2', 
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 1,
          }
        ]
      });
    }
  }, [allData, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(allData.length / BLOCK_SIZE);
  const startRange = currentPage * BLOCK_SIZE + 1;
  const endRange = Math.min((currentPage + 1) * BLOCK_SIZE, allData.length);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: currentTheme.textColor, usePointStyle: true, font: { size: 10 } } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(8)}`
        }
      }
    },
    scales: {
      x: { grid: { display: true, color: "rgba(156, 163, 175, 0.1)" }, ticks: { color: currentTheme.textColor, font: { size: 9 } } },
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temp', color: currentTheme.textColor } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'dB', color: currentTheme.textColor } },
      y2: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'm/s²', color: currentTheme.textColor }, offset: true }
    }
  };

  return (
    <div style={{ background: currentTheme.cardBg, padding: "24px", borderRadius: "20px", height: "480px", display: "flex", flexDirection: "column", border: `1px solid ${currentTheme.borderColor || "rgba(0,0,0,0.1)"}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ color: currentTheme.textColor, margin: 0, fontSize: "16px", fontWeight: "800" }}>Integrated Sensor Analytics</h3>
          <span style={{ fontSize: '11px', color: currentTheme.textColor, opacity: 0.5 }}>Total Samples: {allData.length}</span>
        </div>
        
        {/* NAVIGATION - ORIGINAL DESIGN RESTORED */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.03)', padding: '6px 14px', borderRadius: '30px' }}>
          <button onClick={() => setCurrentPage(0)} disabled={currentPage === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: '8px', marginRight: '4px', opacity: currentPage === 0 ? 0.2 : 1 }}>
            <FiChevronsLeft color="#3b82f6" size={20} />
          </button>

          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage === 0 ? 0.2 : 1 }}>
            <FiChevronLeft color={currentTheme.textColor} size={20} />
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ color: currentTheme.textColor, fontSize: '12px', fontWeight: '800' }}>{startRange} - {endRange}</div>
            <div style={{ color: currentTheme.textColor, fontSize: '9px', opacity: 0.5 }}>PAGE {currentPage + 1} OF {totalPages || 1}</div>
          </div>

          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage >= totalPages - 1 ? 0.2 : 1 }}>
            <FiChevronRight color={currentTheme.textColor} size={20} />
          </button>

          <button onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '8px', marginLeft: '4px', opacity: currentPage >= totalPages - 1 ? 0.2 : 1 }}>
            <FiChevronsRight color="#3b82f6" size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {chartData ? <Line data={chartData} options={options} /> : <div style={{ color: currentTheme.textColor, textAlign: "center", marginTop: "80px" }}>Syncing 3 Sheets...</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
        <button onClick={fetchData} disabled={isRefreshing} style={{ padding: "8px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>
          <FiRefreshCw style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} /> Refresh All
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}