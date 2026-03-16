import React from 'react';
import { 
  Activity, Thermometer, Mic, AlertTriangle, CheckCircle, 
  Zap, FileText, Clock, Trash2, XCircle, ChevronRight 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Tooltip, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const Dashboard = ({ latestData, chartLogs, allRows, onSelectData, onDeleteFile, onClearHistory }) => {
  
  if (!latestData) {
    return (
      <div style={{ color: '#94a3b8', padding: 60, textAlign: 'center', background: '#0f172a', minHeight: '100vh' }}>
        <h3 style={{ color: '#f8fafc' }}>Synchronizing with Multimodal Fusion Engine...</h3>
      </div>
    );
  }

  // --- STATUS LOGIC ---
  const statusValue = latestData["Status (0/1)"]; 
  const isHealthy = statusValue !== undefined && (
    statusValue === 0 || 
    statusValue === "0" || 
    String(statusValue).trim() === "0"
  );

  const successColor = '#4ade80';
  const anomalyColor = '#ef4444';
  const cardBg = 'rgba(30, 41, 59, 0.7)';
  const textMuted = '#94a3b8';

  return (
    <div style={{ padding: "30px", backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      
      {/* 1. ANOMALY BANNER */}
      {!isHealthy && (
        <div style={{
          border: `2px solid ${anomalyColor}`,
          background: 'rgba(239, 68, 68, 0.15)',
          borderRadius: 16,
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          boxShadow: `0 0 20px ${anomalyColor}33`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <AlertTriangle size={32} color={anomalyColor} />
            <div>
              <h3 style={{ color: anomalyColor, margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>ANOMALY DETECTED</h3>
              <p style={{ color: textMuted, margin: 0 }}>System state identified as FAULTY by Multimodal Fusion.</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>FAULTY</div>
        </div>
      )}

      {/* 2. TOP STATUS BAR */}
      <div style={{
        backgroundColor: isHealthy ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        border: `1px solid ${isHealthy ? successColor : anomalyColor}`,
        borderRadius: 12,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        marginBottom: "30px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isHealthy ? <CheckCircle size={22} color={successColor}/> : <Zap size={22} color={anomalyColor}/>}
          <h4 style={{ color: isHealthy ? successColor : anomalyColor, margin: 0, fontSize: '1.2rem' }}>
            Equipment Operating: {isHealthy ? "Healthy" : "Faulty"}
          </h4>
        </div>
        <div style={{ color: textMuted, fontWeight: 'bold' }}>{latestData.Timestamp}</div>
      </div>

      {/* 3. METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* VIBRATION */}
        <MetricCard title="Vibration" icon={<Activity size={20} color="#c084fc"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Vibration || []} lineColor="#c084fc">
          <MetricRow label="RMS" value={latestData.RMS?.toFixed(4)}/>
          <MetricRow label="Kurtosis" value={latestData.Kurtosis?.toFixed(4)}/>
        </MetricCard>

        {/* ACOUSTIC (NOW ADDED) */}
        <MetricCard title="Acoustic" icon={<Mic size={20} color="#38bdf8"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Acoustic || []} lineColor="#38bdf8">
          <MetricRow label="Acoustic Level" value={latestData.Acoustic?.toFixed(4)}/>
          <MetricRow label="Peak Amp" value={latestData.PeakAmp?.toFixed(4)}/>
        </MetricCard>

        {/* THERMAL */}
        <MetricCard title="Thermal" icon={<Thermometer size={20} color="#fb7185"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Thermal || []} lineColor="#fb7185">
          <MetricRow label="Avg Temp" value={latestData.Temperature?.toFixed(4)}/>
          <div style={{ marginTop: 15, height: 4, background: '#334155', borderRadius: 2 }}>
             <div style={{ width: `${Math.min(latestData.Temperature, 100)}%`, height: '100%', background: '#fb7185', borderRadius: 2 }}></div>
          </div>
        </MetricCard>
      </div>
      
      {/* 4. HISTORY SECTION */}
      <div style={{ background: cardBg, borderRadius: 20, padding: '30px', border: `1px solid #334155` }}>
        <h3 style={{ marginBottom: 20 }}>Analysis Repository</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allRows?.slice(0, 10).map((row, index) => {
            const rowVal = row["Status"] ?? row["Status (0/1)"];
            const isRowHealthy = String(rowVal).trim() === "0" || rowVal === 0;
            return (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: 'rgba(15, 23, 42, 0.3)', borderRadius: 12, border: `1px solid ${isRowHealthy ? '#334155' : anomalyColor}` }}>
                <span>{row.timestamp}</span>
                <span style={{ color: isRowHealthy ? successColor : anomalyColor, fontWeight: 'bold' }}>
                  {isRowHealthy ? 'Healthy' : 'Faulty'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
    <span style={{ color: '#94a3b8' }}>{label}</span>
    <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>{value || "0.0000"}</span>
  </div>
);

const MetricCard = ({ title, icon, status, statusColor, children, bgColor, chartData, lineColor }) => {
  const chartProps = {
    labels: chartData.map((_, i) => i),
    datasets: [{ data: chartData, borderColor: lineColor, backgroundColor: `${lineColor}15`, fill: true, tension: 0.4, pointRadius: 0 }]
  };
  return (
    <div style={{ backgroundColor: bgColor, borderRadius: 20, padding: '24px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon} <h3 style={{ margin: 0 }}>{title}</h3></div>
        <span style={{ color: statusColor, fontWeight: 'bold', fontSize: '0.8rem' }}>{status}</span>
      </div>
      <div style={{ height: 60, marginBottom: 15 }}><Line data={chartProps} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: false }, scales: { x: { display: false }, y: { display: false } } }} /></div>
      {children}
    </div>
  );
};

export default Dashboard;