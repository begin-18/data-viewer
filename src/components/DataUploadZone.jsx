import React, { useState } from 'react';
import DropZone from './DropZone'; 
import { Settings, Database, FileText, LayoutGrid, FileCode, Info, ShieldCheck } from 'lucide-react';

const DataUploadPage = ({ currentTheme }) => {
    const [uploadMode, setUploadMode] = useState('standard'); 

    // Professional Color Palette
    const colors = {
        bg: '#0f172a',
        card: 'rgba(30, 41, 59, 0.7)',
        border: '#334155',
        textMuted: '#94a3b8',
        acoustic: '#38bdf8',
        thermal: '#fb7185',
        vibration: '#c084fc',
        success: '#4ade80'
    };

    return (
        <div className="upload-page-wrapper" style={{ 
            backgroundColor: colors.bg, 
            minHeight: '100vh',
            padding: '40px 24px',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                
                {/* 1. Header & Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: colors.success, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                            <ShieldCheck size={14} /> System Secure
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Data Engine</h1>
                        <p style={{ color: colors.textMuted, marginTop: '4px' }}>Manage and fuse multimodal sensor datasets</p>
                    </div>
                    
                    <div style={{ display: 'flex', background: '#1e293b', padding: '4px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                        <button 
                            onClick={() => setUploadMode('standard')}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: uploadMode === 'standard' ? '#334155' : 'transparent',
                                color: uploadMode === 'standard' ? '#fff' : colors.textMuted,
                                fontWeight: '600', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s'
                            }}>
                            <LayoutGrid size={18} /> Standard
                        </button>
                        <button 
                            onClick={() => setUploadMode('binary')}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                backgroundColor: uploadMode === 'binary' ? '#334155' : 'transparent',
                                color: uploadMode === 'binary' ? '#fff' : colors.textMuted,
                                fontWeight: '600', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s'
                            }}>
                            <FileCode size={18} /> Binary
                        </button>
                    </div>
                </div>

                {/* 2. Upload Section with Professional Styling */}
                <div style={{ marginBottom: '50px' }}>
                    {uploadMode === 'standard' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                            <UploadBlock title="Acoustic Data" color={colors.acoustic} subtitle="Microphone Signal (CSV/XLSX)" />
                            <UploadBlock title="Thermal Data" color={colors.thermal} subtitle="Temperature Probe (CSV/XLSX)" />
                            <UploadBlock title="Vibration Data" color={colors.vibration} subtitle="Accelerometer (CSV/XLSX)" />
                        </div>
                    ) : (
                        <div style={{ maxWidth: '600px' }}>
                            <UploadBlock title="Full Multimodal Fusion" color={colors.vibration} subtitle="Deep Learning Input (.MAT / .TDMS)" />
                        </div>
                    )}
                </div>

                {/* 3. Supported Formats - Professional Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <FormatCard title="CSV / Excel" desc="Auto-syncs to Google Sheets. Use [Time, Value] format." icon={<FileText size={20} color={colors.success}/>} />
                    <FormatCard title="Binary Fusion" desc="TDMS/MAT files processed via Python backend." icon={<Settings size={20} color={colors.acoustic}/>} />
                    <FormatCard title="Anomaly Detection" desc="Automatic labeling via trained Deep Learning model." icon={<Database size={20} color={colors.vibration}/>} />
                </div>
            </div>
        </div>
    );
};

// Sub-component to wrap the DropZone with a professional dark background
const UploadBlock = ({ title, color, subtitle }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{subtitle}</div>
        </div>
        
        {/* The DropZone Container - Custom Dark Styling */}
        <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            border: '2px dashed #334155',
            borderRadius: '16px',
            padding: '8px',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
        >
            <DropZone 
                allowedExtensions={['csv', 'xlsx', 'mat', 'tdms']}
                style={{ background: 'transparent', border: 'none' }} // Ensure your DropZone component allows style overrides
            />
        </div>
    </div>
);

const FormatCard = ({ title, desc, icon }) => (
    <div style={{ 
        backgroundColor: 'rgba(30, 41, 59, 0.4)', 
        border: '1px solid #334155', 
        padding: '24px', 
        borderRadius: '16px', 
        display: 'flex', 
        gap: '20px',
        alignItems: 'flex-start'
    }}>
        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>{icon}</div>
        <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px', color: '#f8fafc' }}>{title}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>{desc}</div>
        </div>
    </div>
);

export default DataUploadPage;