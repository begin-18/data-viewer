import React, { useState } from 'react';
import DropZone from './DropZone'; 
import { Settings, Database, ShieldCheck, Cpu, Activity, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const DataUploadPage = () => {
    const [isUploaded, setIsUploaded] = useState(false);
    const [uploadData, setUploadData] = useState(null);

    const colors = {
        bg: '#0f172a',
        card: 'rgba(30, 41, 59, 0.7)',
        border: '#1e293b',
        textMuted: '#94a3b8',
        accent: '#c084fc', 
        success: '#4ade80'
    };

    // Simulated handle for when the DropZone finishes
    const handleUploadSuccess = (data) => {
        setUploadData(data);
        setIsUploaded(true);
    };

    return (
        <div className="upload-page-wrapper" style={{ 
            backgroundColor: colors.bg, 
            minHeight: '100vh',
            padding: '60px 24px',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
            backgroundImage: 'radial-gradient(circle at 2px 2px, #1e293b 1px, transparent 0)',
            backgroundSize: '40px 40px'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                {/* 1. Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 8, color: colors.success, 
                        background: 'rgba(74, 222, 128, 0.1)', padding: '6px 16px', borderRadius: '100px',
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16,
                        border: '1px solid rgba(74, 222, 128, 0.2)'
                    }}>
                        <ShieldCheck size={14} /> Neural Gateway Active
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em', background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Data Fusion Engine
                    </h1>
                </div>

                {/* 2. Main Upload / Success Card */}
                <div style={{ 
                    background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                    padding: '40px', borderRadius: '24px', border: `1px solid ${isUploaded ? colors.success : colors.border}`,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', marginBottom: '40px', transition: 'all 0.5s ease'
                }}>
                    {!isUploaded ? (
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
                                <div style={{ background: colors.accent, padding: '8px', borderRadius: '8px' }}><Zap size={20} color="#fff" /></div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Binary Multimodal Input</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textMuted }}>Accepting .TDMS and .MAT fusion streams</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: `2px dashed ${colors.border}`, borderRadius: '20px', padding: '20px' }}>
                                <DropZone 
                                    allowedExtensions={['mat', 'tdms']}
                                    onSuccess={handleUploadSuccess} // Make sure your DropZone calls this
                                    style={{ background: 'transparent', border: 'none' }} 
                                />
                            </div>
                        </div>
                    ) : (
                        /* SUCCESS STATE */
                        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '20px', borderRadius: '50%' }}>
                                    <CheckCircle2 size={48} color={colors.success} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Processing Complete</h2>
                            <p style={{ color: colors.textMuted, marginBottom: '32px' }}>
                                Features extracted and synchronized to Google Cloud storage.
                            </p>
                            
                            <button 
                                onClick={() => window.location.href = '/dashboard'} // Adjust your route
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 10,
                                    backgroundColor: colors.success, color: '#0f172a',
                                    padding: '14px 28px', borderRadius: '12px', border: 'none',
                                    fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    boxShadow: '0 10px 15px -3px rgba(74, 222, 128, 0.3)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Open Analytics Dashboard <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Operational Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <FormatCard 
                        title="Feature Extraction" 
                        desc="Automated RMS, Kurtosis, and Skewness calculation via Python backend." 
                        icon={<Activity size={20} color={colors.accent}/>} 
                    />
                    <FormatCard 
                        title="Cloud Sync" 
                        desc="Results are automatically appended to Google Sheets for real-time monitoring." 
                        icon={<Database size={20} color={colors.success}/>} 
                    />
                </div>

                {/* 4. Technical Footer Info */}
                <div style={{ marginTop: '40px', textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem', display: 'flex', justifyContent: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={14}/> NumPy 2.0 Core</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Settings size={14}/> Scipy Signal Processing</div>
                </div>
            </div>
        </div>
    );
};

const FormatCard = ({ title, desc, icon }) => (
    <div style={{ 
        backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid #1e293b', 
        padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px', width: 'fit-content', border: '1px solid #1e293b' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>{title}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.5' }}>{desc}</div>
        </div>
    </div>
);

export default DataUploadPage;