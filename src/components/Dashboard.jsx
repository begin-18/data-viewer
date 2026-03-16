import React from 'react';
import { 
  Activity, Thermometer, Mic, AlertTriangle, CheckCircle, 
  Zap, RefreshCw
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Tooltip, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const Dashboard = ({ latestData, chartLogs }) => {
  
  // High-end UI Font Stacks
  const uiFont = "'Inter', -apple-system, system-ui, sans-serif";
  const monoFont = "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace";

  if (!latestData) {
    return (
      <div style={{ 
        color: '#94a3b8', padding: 60, textAlign: 'center', background: '#0f172a', 
        minHeight: '100vh', fontFamily: uiFont 
      }}>
        <h3 style={{ color: '#f8fafc', fontWeight: 600 }}>Synchronizing with Multimodal Fusion Engine...</h3>
      </div>
    );
  }

  const statusValue = latestData["Status (0/1)"]; 
  const isHealthy = statusValue !== undefined && (
    statusValue === 0 || statusValue === "0" || String(statusValue).trim() === "0"
  );

  const successColor = '#4ade80';
  const anomalyColor = '#ef4444';
  const cardBg = 'rgba(30, 41, 59, 0.4)';
  const textMuted = '#94a3b8';

  return (
    <div style={{ 
      padding: "30px", backgroundColor: '#0f172a', minHeight: '100vh', 
      color: '#f8fafc', fontFamily: uiFont, letterSpacing: '-0.01em' 
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
           <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>System Monitor</h2>
           <p style={{ margin: 0, color: textMuted, fontSize: '0.9rem', fontWeight: 500 }}>Real-time rotating equipment analysis</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b',
            color: '#f8fafc', border: '1px solid #334155', padding: '10px 18px',
            borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: 700, fontSize: '0.85rem', fontFamily: uiFont, textTransform: 'uppercase'
          }}
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* 1. ANOMALY BANNER */}
      {!isHealthy && (
        <div style={{
          border: `1px solid ${anomalyColor}`,
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20, padding: '24px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '30px', boxShadow: `0 10px 40px ${anomalyColor}15`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ backgroundColor: anomalyColor, padding: 12, borderRadius: 14 }}>
                <AlertTriangle size={30} color="#fff" />
            </div>
            <div>
              <h3 style={{ color: '#fff', margin: 0, fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>ANOMALY DETECTED</h3>
              <p style={{ color: anomalyColor, margin: 0, fontWeight: 600 }}>System state identified as FAULTY by Fusion Engine</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fff', letterSpacing: '2px' }}>FAULTY</div>
        </div>
      )}

      {/* 2. TOP STATUS BAR */}
      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.2)',
        border: `1px solid ${isHealthy ? '#4ade8033' : '#ef444433'}`,
        borderRadius: 14, padding: "14px 24px", display: "flex",
        alignItems: "center", justifyContent: 'space-between', marginBottom: "30px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            height: 10, width: 10, borderRadius: '50%', 
            backgroundColor: isHealthy ? successColor : anomalyColor, 
            boxShadow: `0 0 12px ${isHealthy ? successColor : anomalyColor}` 
          }}></div>
          <h4 style={{ color: '#f8fafc', margin: 0, fontSize: '1rem', fontWeight: 700 }}>
            Equipment Status: <span style={{ color: isHealthy ? successColor : anomalyColor, textTransform: 'uppercase' }}>{isHealthy ? "Nominal" : "Critical"}</span>
          </h4>
        </div>
        <div style={{ color: textMuted, fontWeight: 600, fontSize: '0.85rem', fontFamily: monoFont }}>{latestData.Timestamp}</div>
      </div>

      {/* 3. METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        <MetricCard title="Vibration" icon={<Activity size={18} color="#c084fc"/>} status={isHealthy ? "STABLE" : "FAULT"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Vibration || []} lineColor="#c084fc" monoFont={monoFont}>
          <MetricRow label="RMS" value={latestData.RMS?.toFixed(5)} monoFont={monoFont}/>
          <MetricRow label="Kurtosis" value={latestData.Kurtosis?.toFixed(5)} monoFont={monoFont}/>
          <MetricRow label="Peak Amp" value={latestData.PeakAmp?.toFixed(5)} monoFont={monoFont}/>
        </MetricCard>

        <MetricCard title="Acoustic" icon={<Mic size={18} color="#38bdf8"/>} status={isHealthy ? "STABLE" : "FAULT"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Acoustic || []} lineColor="#38bdf8" monoFont={monoFont}>
          <MetricRow label="RMS" value={latestData.RMS?.toFixed(5)} monoFont={monoFont}/>
          <MetricRow label="Kurtosis" value={latestData.Kurtosis?.toFixed(5)} monoFont={monoFont}/>
          <MetricRow label="Peak Amp" value={latestData.PeakAmp?.toFixed(5)} monoFont={monoFont}/>
        </MetricCard>

        <MetricCard title="Thermal" icon={<Thermometer size={18} color="#fb7185"/>} status={isHealthy ? "NORMAL" : "HIGH"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Thermal || []} lineColor="#fb7185" monoFont={monoFont}>
          <MetricRow label="Core Temp" value={`${latestData.Temperature?.toFixed(2)}°C`} monoFont={monoFont}/>
          <div style={{ marginTop: 20, height: 6, background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
             <div style={{ width: `${Math.min(latestData.Temperature, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #fb7185, #f43f5e)', borderRadius: 10, transition: 'width 0.5s ease' }}></div>
          </div>
        </MetricCard>
      </div>

    </div>
  );
};

const MetricRow = ({ label, value, monoFont }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: monoFont, fontSize: '1rem' }}>{value || "0.00000"}</span>
  </div>
);

const MetricCard = ({ title, icon, status, statusColor, children, bgColor, chartData, lineColor, monoFont }) => {
  const chartProps = {
    labels: chartData.map((_, i) => i),
    datasets: [{ data: chartData, borderColor: lineColor, borderWidth: 2, backgroundColor: `${lineColor}10`, fill: true, tension: 0.4, pointRadius: 0 }]
  };
  return (
    <div style={{ 
        backgroundColor: bgColor, borderRadius: 24, padding: '28px', 
        border: '1px solid #334155', backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: lineColor }}>{icon}</div> 
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h3>
        </div>
        <span style={{ 
            color: statusColor, fontWeight: 900, fontSize: '0.7rem', 
            letterSpacing: '0.08em', backgroundColor: `${statusColor}15`,
            padding: '5px 10px', borderRadius: '8px', border: `1px solid ${statusColor}44`
        }}>{status}</span>
      </div>
      <div style={{ height: 75, marginBottom: 20 }}>
        <Line data={chartProps} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: false }, scales: { x: { display: false }, y: { display: false } } }} />
      </div>
      {children}
    </div>
  );
};

export default Dashboard;