import React, { useState } from 'react';
import DropZone from './DropZone'; 
import { Settings, Database, ShieldCheck, Cpu, Activity, Zap, ArrowRight, LayoutDashboard } from 'lucide-react';

const DataUploadPage = ({ onNavigate }) => {
    const [isUploaded, setIsUploaded] = useState(false);

    const colors = {
        bg: '#0f172a',
        card: 'rgba(30, 41, 59, 0.7)',
        border: '#1e293b',
        textMuted: '#94a3b8',
        accent: '#c084fc', 
        success: '#4ade80',
        primary: '#3b82f6'
    };

    const handleUploadSuccess = (data) => {
        setIsUploaded(true);
    };

    return (
        <div style={{ 
            backgroundColor: colors.bg, minHeight: '100vh', padding: '60px 24px', color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
            backgroundImage: 'radial-gradient(circle at 2px 2px, #1e293b 1px, transparent 0)',
            backgroundSize: '40px 40px'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '100%', background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                        padding: '40px', borderRadius: '24px', border: `1px solid ${isUploaded ? colors.success : colors.border}`,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', transition: 'all 0.5s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
                            <div style={{ background: colors.accent, padding: '8px', borderRadius: '8px' }}><Zap size={20} color="#fff" /></div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Binary Multimodal Input</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textMuted }}>Drop .TDMS or .MAT files to trigger feature extraction</p>
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: `2px dashed ${isUploaded ? colors.success : colors.border}`, borderRadius: '20px', padding: '10px' }}>
                            {/* Pass onNavigate down to the DropZone so the button can use it */}
                            <DropZone 
                                allowedExtensions={['mat', 'tdms']} 
                                onSuccess={handleUploadSuccess} 
                                onNavigate={onNavigate} 
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
                    <FormatCard title="Neural Processing" desc="Automated signal decomposition via Python." icon={<Activity size={20} color={colors.accent}/>} />
                    <FormatCard title="Live Cloud Ledger" desc="Synchronized appending to Google Sheets." icon={<Database size={20} color={colors.success}/>} />
                </div>
            </div>
        </div>
    );
};

const FormatCard = ({ title, desc, icon }) => (
    <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid #1e293b', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', width: 'fit-content', border: '1px solid #1e293b' }}>{icon}</div>
        <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>{title}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{desc}</div>
        </div>
    </div>
);

export default DataUploadPage;