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
  
  if (!latestData) {
    return (
      <div style={{ color: '#94a3b8', padding: 60, textAlign: 'center', background: '#0f172a', minHeight: '100vh' }}>
        <h3 style={{ color: '#f8fafc' }}>Synchronizing with Multimodal Fusion Engine...</h3>
      </div>
    );
  }

  const statusValue = latestData["Status (0/1)"]; 
  const isHealthy = String(statusValue).trim() === "0";

  const successColor = '#4ade80';
  const anomalyColor = '#ef4444';
  const cardBg = 'rgba(30, 41, 59, 0.7)';
  const textMuted = '#94a3b8';

  return (
    <div style={{ padding: "30px", backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>System Monitor</h2>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b',
            color: '#f8fafc', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} /> Refresh Data
        </button>
      </div>

      {!isHealthy && (
        <div style={{ border: `2px solid ${anomalyColor}`, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 16, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <AlertTriangle size={32} color={anomalyColor} />
            <div>
              <h3 style={{ color: anomalyColor, margin: 0, fontWeight: 800 }}>ANOMALY DETECTED</h3>
              <p style={{ color: textMuted, margin: 0 }}>System state identified as FAULTY.</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>FAULTY</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* VIBRATION CARD */}
        <MetricCard title="Vibration" icon={<Activity size={20} color="#c084fc"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Vibration || []} lineColor="#c084fc">
          <MetricRow label="RMS" value={latestData.vibRMS?.toFixed(4)}/>
          <MetricRow label="Kurtosis" value={latestData.vibKurtosis?.toFixed(4)}/>
          <MetricRow label="Skewness" value={latestData.vibSkewness?.toFixed(4)}/>
          <MetricRow label="Peak Amp" value={latestData.vibPeak?.toFixed(4)}/>
        </MetricCard>

        {/* ACOUSTIC CARD */}
        <MetricCard title="Acoustic" icon={<Mic size={20} color="#38bdf8"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Acoustic || []} lineColor="#38bdf8">
          <MetricRow label="RMS" value={latestData.acRMS?.toFixed(4)}/>
          <MetricRow label="Kurtosis" value={latestData.acKurtosis?.toFixed(4)}/>
          <MetricRow label="Skewness" value={latestData.acSkewness?.toFixed(4)}/>
          <MetricRow label="Peak Amp" value={latestData.acPeak?.toFixed(4)}/>
        </MetricCard>

        {/* THERMAL CARD */}
        <MetricCard title="Thermal" icon={<Thermometer size={20} color="#fb7185"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Thermal || []} lineColor="#fb7185">
          <MetricRow label="Avg Temp" value={latestData.Temperature?.toFixed(4)}/>
          <div style={{ marginTop: 15, height: 4, background: '#334155', borderRadius: 2 }}>
             <div style={{ width: `${Math.min(latestData.Temperature, 100)}%`, height: '100%', background: '#fb7185', borderRadius: 2 }}></div>
          </div>
        </MetricCard>
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