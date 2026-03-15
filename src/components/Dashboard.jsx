import React from 'react';
import { 
  Activity, 
  Thermometer, 
  Mic, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  FileText, 
  Clock, 
  Trash2, 
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const Dashboard = ({ latestData, chartLogs, allRows, currentTheme, onSelectData, onDeleteFile, onClearHistory }) => {
  
  if (!latestData) {
    return (
      <div style={{ color: '#94a3b8', padding: 60, textAlign: 'center', background: '#0f172a', minHeight: '100vh' }}>
        <div style={{ marginBottom: 20, display: 'inline-block', padding: 20, background: '#1e293b', borderRadius: '50%' }}>
          <Activity size={40} className="animate-pulse" color="#38bdf8" />
        </div>
        <h3 style={{ color: '#f8fafc' }}>Initializing Sensor Stream...</h3>
        <p style={{ opacity: 0.6 }}>Synchronizing with Multimodal Fusion Engine</p>
      </div>
    );
  }

  // LOGIC: Check the specific "Status (0/1)" column from your sheet
  const statusValue = latestData["Status (0/1)"]; 
  const isHealthy = String(statusValue) === "0" || statusValue === 0;

  const cardBg = 'rgba(30, 41, 59, 0.7)'; 
  const textMuted = '#94a3b8';
  const successColor = '#4ade80';
  const anomalyColor = '#ef4444';

  return (
    <div style={{ padding: "30px", backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      
      {/* 1. FAULT DETECTION BANNER - Appears when status is 1 */}
      {!isHealthy && (
        <div style={{
          border: `1px solid ${anomalyColor}`,
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 16,
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.2)', borderRadius: '50%' }}>
              <AlertTriangle size={28} color={anomalyColor} />
            </div>
            <div>
              <h3 style={{ color: anomalyColor, margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>ANOMALY DETECTED</h3>
              <p style={{ color: textMuted, margin: '4px 0 0 0', fontSize: '0.95rem' }}>Component failure likely detected by multimodal fusion.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>FAULTY</div>
            <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>System State</div>
          </div>
        </div>
      )}

      {/* 2. TOP STATUS BAR */}
      <div style={{
        backgroundColor: isHealthy ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        border: `1px solid ${isHealthy ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        borderRadius: 12,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        marginBottom: "30px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isHealthy ? <CheckCircle size={22} color={successColor}/> : <Zap size={22} color={anomalyColor}/>}
          <div>
            <span style={{ color: textMuted, fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>System Status</span>
            <h4 style={{ color: isHealthy ? successColor : anomalyColor, margin: 0, fontSize: '1.1rem' }}>
              Equipment Operating: {isHealthy ? "Healthy" : "Faulty"}
            </h4>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: textMuted, fontSize: '0.8rem' }}>Timestamp</span>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{latestData.Timestamp}</div>
        </div>
      </div>

      {/* 3. ANALYTICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <MetricCard title="Vibration" icon={<Activity size={20} color="#c084fc"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Vibration || []} lineColor="#c084fc">
          <MetricRow label="RMS" value={latestData.RMS?.toFixed(4)}/>
          <MetricRow label="Kurtosis" value={latestData.Kurtosis?.toFixed(4)}/>
          <MetricRow label="Peak Amp" value={latestData.PeakAmp?.toFixed(4)}/>
        </MetricCard>

        <MetricCard title="Acoustic" icon={<Mic size={20} color="#38bdf8"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Acoustic || []} lineColor="#38bdf8">
          <MetricRow label="RMS" value={latestData.RMS?.toFixed(4)}/>
          <MetricRow label="Kurtosis" value={latestData.Kurtosis?.toFixed(4)}/>
          <MetricRow label="Peak Amp" value={latestData.PeakAmp?.toFixed(4)}/>
        </MetricCard>

        <MetricCard title="Thermal" icon={<Thermometer size={20} color="#fb7185"/>} status={isHealthy ? "Healthy" : "Faulty"} statusColor={isHealthy ? successColor : anomalyColor} bgColor={cardBg} chartData={chartLogs?.Thermal || []} lineColor="#fb7185">
          <MetricRow label="Avg Temp" value={latestData.Temperature?.toFixed(4)}/>
          <MetricRow label="Max Observed" value={(latestData.Temperature + 0.521).toFixed(4)}/>
          <div style={{ marginTop: 15, height: 4, background: '#334155', borderRadius: 2 }}>
             <div style={{ width: `${Math.min(latestData.Temperature, 100)}%`, height: '100%', background: '#fb7185', borderRadius: 2 }}></div>
          </div>
        </MetricCard>

      </div>

      {/* 4. HISTORY SECTION */}
      <div style={{ background: cardBg, borderRadius: 20, padding: '30px', border: `1px solid #334155`, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={22} color="#38bdf8" /> Analysis Repository
            </h3>
            <p style={{ color: textMuted, fontSize: '0.85rem', marginTop: 4 }}>Historical sensor logs and diagnostic results</p>
          </div>
          
          {allRows && allRows.length > 0 && (
            <button 
              onClick={() => { if(window.confirm("Are you sure you want to clear the entire history?")) onClearHistory(); }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <XCircle size={16} /> Clear Engine Logs
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(!allRows || allRows.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textMuted, border: '2px dashed #334155', borderRadius: 12 }}>
              No data logs available in the current session.
            </div>
          ) : (
            allRows.map((row, index) => {
              // Row level check for history items using the column label
              const rowStatus = row["Status (0/1)"];
              const isRowHealthy = String(rowStatus) === "0" || rowStatus === 0;
              
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: latestData.Timestamp === row.timestamp ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.3)',
                    border: `1px solid ${latestData.Timestamp === row.timestamp ? '#38bdf8' : '#334155'}`,
                    borderRadius: '12px',
                    paddingRight: '12px'
                  }}
                >
                  <button
                    onClick={() => onSelectData(row)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ padding: 8, background: '#1e293b', borderRadius: 8 }}>
                         <Clock size={16} color={latestData.Timestamp === row.timestamp ? "#38bdf8" : textMuted} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Log_{row.timestamp.replace(/[/ :]/g, '_')}</div>
                        <div style={{ fontSize: '0.75rem', color: textMuted }}>{row.timestamp}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        background: isRowHealthy ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isRowHealthy ? successColor : anomalyColor,
                        border: `1px solid ${isRowHealthy ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {isRowHealthy ? 'Healthy' : 'Faulty'}
                      </div>
                      <ChevronRight size={18} color={textMuted} />
                    </div>
                  </button>

                  <div style={{ width: 1, height: 30, background: '#334155', margin: '0 8px' }}></div>

                  <button 
                    onClick={() => onDeleteFile(row.timestamp)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '10px'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const MetricRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</span>
    <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace' }}>{value || "0.0000"}</span>
  </div>
);

const MetricCard = ({ title, icon, status, statusColor, children, bgColor, chartData, lineColor }) => {
  const chartProps = {
    labels: chartData.map((_, i) => i),
    datasets: [{
      data: chartData,
      borderColor: lineColor,
      backgroundColor: `${lineColor}15`,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  };

  return (
    <div style={{ 
      backgroundColor: bgColor, 
      borderRadius: 20, 
      padding: '24px', 
      border: '1px solid #334155'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: '#0f172a', borderRadius: 10 }}>{icon}</div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: statusColor, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, backgroundColor: statusColor, borderRadius: '50%' }}></span>
          {status}
        </div>
      </div>
      
      <div style={{ height: 80, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 12, marginBottom: 20, padding: '5px' }}>
         <Line data={chartProps} options={chartOptions} />
      </div>

      <div>{children}</div>
    </div>
  );
};

export default Dashboard;