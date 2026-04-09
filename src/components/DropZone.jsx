import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, Database, ChevronRight, LayoutGrid } from 'lucide-react';

// Define the API URL once at the top
// Change this in your DropZone.jsx or App.jsx
const API_BASE_URL = 'https://thesis-backend-aukn.onrender.com';

const DropZone = ({ onNavigate, onUploadSuccess }) => {
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (uploadedFiles.length >= 3) {
      setMsg("Maximum of 3 files reached. Please remove one to add another.");
      setStatus('error');
      return;
    }

    const isMatFile = file.name.toLowerCase().endsWith('.mat');
    const usedTypes = uploadedFiles.map(f => f.type);
    
    if (isMatFile && usedTypes.includes('Vibration') && usedTypes.includes('Acoustic')) {
      setMsg("Cannot add .mat file: Vibration and Acoustic slots are full, and .mat does not support Thermal.");
      setStatus('error');
      return;
    }

    setMsg("");
    setStatus('');

    let defaultType = 'Vibration';
    if (usedTypes.includes('Vibration')) defaultType = 'Acoustic';
    if (usedTypes.includes('Vibration') && usedTypes.includes('Acoustic')) {
      defaultType = isMatFile ? null : 'Thermal';
    }

    const newFile = {
      id: Date.now(),
      file: file,
      name: file.name,
      type: defaultType,
      isMat: isMatFile
    };

    setUploadedFiles(prev => [...prev, newFile]);
  };

  const handleFuseAndUpload = async () => {
    if (uploadedFiles.length === 0) {
      onNavigate("Dashboard");
      return;
    }

    setStatus('loading');
    setMsg("Sending data to Google Sheets...");

    try {
      // Loop through each file and upload
      for (const fileObj of uploadedFiles) {
        const fd = new FormData();
        fd.append('file', fileObj.file);
        fd.append('mapping', fileObj.type);
        
        await axios.post(`${API_BASE_URL}/api/upload-data`, fd);
      }
      
      setStatus('success');
      setMsg("All modalities fused and uploaded!");
      if (onUploadSuccess) onUploadSuccess();
      setTimeout(() => onNavigate("Dashboard"), 1000);
    } catch (e) {
      setStatus('error');
      setMsg(e.response?.data?.error || "Check Local API Connection");
    }
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    setMsg(""); 
    setStatus('');
  };

  const updateFileType = (id, newType) => {
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, type: newType } : f));
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #334155' }}>
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
          style={{ 
            border: status === 'loading' ? '2px dashed #a78bfa' : '2px dashed #334155', 
            padding: '30px', textAlign: 'center', borderRadius: '16px',
            backgroundColor: status === 'loading' ? 'rgba(167, 139, 250, 0.05)' : '#0f172a',
            marginBottom: '24px', cursor: 'pointer'
          }}
        >
          <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} id="mat-in" />
          <label htmlFor="mat-in" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {status === 'loading' ? '⚡ UPLOADING...' : 'CLICK OR DRAG .MAT & .TDMS FILES'}
              </div>
              <div style={{ fontSize: '13px', color: status === 'error' ? '#ef4444' : '#64748b', marginTop: '8px' }}>
                {msg || "Assign each file a unique modality (Max 3 Files)"}
              </div>
          </label>
        </div>

        <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Database size={18} color="#94a3b8" />
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 600 }}>File Configuration ({uploadedFiles.length}/3)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploadedFiles.map((file) => {
                const otherSelectedTypes = uploadedFiles
                  .filter(f => f.id !== file.id)
                  .map(f => f.type);

                return (
                  <div key={file.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: '#1e293b', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #334155',
                  }}>
                    <div style={{ width: '60%', minWidth: '0', flexShrink: 0 }}>
                      <span style={{ 
                        color: '#f8fafc', 
                        fontWeight: 600, 
                        display: 'block', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {file.name}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                      <div style={{ 
                        background: '#0f172a', 
                        padding: '4px 8px', 
                        borderRadius: '8px', 
                        border: '1px solid #334155', 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '8px' }}>Map To:</span>
                        <select 
                          value={file.type} 
                          onChange={(e) => updateFileType(file.id, e.target.value)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#a78bfa', 
                            fontWeight: 700, 
                            cursor: 'pointer', 
                            outline: 'none' 
                          }}
                        >
                          <option value="Vibration" disabled={otherSelectedTypes.includes("Vibration")}>
                            Vibration
                          </option>
                          <option value="Acoustic" disabled={otherSelectedTypes.includes("Acoustic")}>
                            Acoustic
                          </option>
                          {!file.isMat && (
                            <option value="Thermal" disabled={otherSelectedTypes.includes("Thermal")}>
                              Thermal
                            </option>
                          )}
                        </select>
                      </div>
                      <button 
                        onClick={() => removeFile(file.id)} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <button 
        onClick={handleFuseAndUpload}
        disabled={status === 'loading' || uploadedFiles.some(f => !f.type)}
        style={{ 
          width: '100%', padding: '16px', borderRadius: '12px', border: 'none', 
          backgroundColor: status === 'loading' ? '#475569' : '#10b981', color: '#fff', 
          fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', 
          gap: '12px', cursor: 'pointer', fontSize: '1rem'
        }}
      >
        <LayoutGrid size={20} />
        {status === 'loading' ? 'PROCESSING...' : (uploadedFiles.length > 0 ? `FUSE ${uploadedFiles.length} MODALITIES & UPLOAD` : 'GO TO DASHBOARD')}
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default DropZone;