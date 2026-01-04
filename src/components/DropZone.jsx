import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://thesis-data-gl06.onrender.com/api/upload-data';

// Added currentTheme to props
const DropZone = ({ dataType, allowedExtensions, currentTheme }) => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState(''); 
    const [message, setMessage] = useState('');

    // Logic for colors based on theme
    const isDark = currentTheme?.isDark || false; 
    const bgColor = dragging 
        ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#f0f8ff') 
        : (currentTheme?.cardBg || '#f9f9f9');
    
    const textColor = currentTheme?.textColor || '#333';
    const borderColor = dragging ? '#3b82f6' : (currentTheme?.borderColor || '#ccc');

    const handleFileDrop = (droppedFile) => {
        if (!droppedFile) return;
        const extension = droppedFile.name.split('.').pop().toLowerCase();
        
        setStatus('');
        setMessage('');
        
        if (!allowedExtensions.includes(extension)) {
            setStatus('error');
            setMessage(`Invalid file type: .${extension}. Expected: ${allowedExtensions.join(', ')}.`);
            setFile(null);
            return;
        }

        setFile(droppedFile);
        setMessage(`File selected: ${droppedFile.name}. Attempting upload...`);
        uploadFile(droppedFile); 
    };

    const uploadFile = async (fileToUpload) => {
        setStatus('loading');
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('dataType', dataType); 

        try {
            const response = await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStatus('success');
            setFile(null);
            setMessage(response.data.message || `Successfully uploaded ${fileToUpload.name}.`);
        } catch (error) {
            setStatus('error');
            let errorMessage = 'Upload failed.';
            if (error.response) {
                errorMessage = `Server Error (${error.response.status}): ${error.response.data?.message || 'Check logs'}`;
            } else if (error.request) {
                errorMessage = 'No response from server. Check network.';
            }
            setMessage(errorMessage);
        }
    };

    const StatusIndicator = () => {
        if (status === 'loading') return <div style={{ color: '#3b82f6', marginTop: '10px', fontSize: '13px' }}>⏳ {message}</div>;
        if (status === 'success') return <div style={{ color: '#10b981', marginTop: '10px', fontSize: '13px' }}>✅ {message}</div>;
        if (status === 'error') return <div style={{ color: '#ef4444', marginTop: '10px', fontSize: '13px' }}>❌ {message}</div>;
        return null;
    };

    return (
        <div 
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileDrop(e.dataTransfer.files[0]); }}
            style={{
                border: `2px dashed ${borderColor}`,
                padding: '30px 20px',
                textAlign: 'center',
                margin: '15px 0',
                borderRadius: '15px',
                backgroundColor: bgColor,
                transition: 'all 0.3s ease',
                boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.05)'
            }}
        >
            <h3 style={{ margin: '0 0 8px 0', color: textColor, fontSize: '16px', fontWeight: '800' }}>
                {dataType} DATA
            </h3>
            
            <p style={{ color: textColor, opacity: 0.7, fontSize: '13px', marginBottom: '15px' }}>
                Drag & drop or browse
            </p>

            <input 
                type="file" 
                onChange={(e) => handleFileDrop(e.target.files[0])} 
                style={{ display: 'none' }} 
                id={`file-upload-${dataType}`}
                accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
            />
            
            <label 
                htmlFor={`file-upload-${dataType}`} 
                style={{ 
                    cursor: 'pointer', 
                    color: '#3b82f6', 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
            >
                Browse File
            </label>
            
            <StatusIndicator />
        </div>
    );
};

export default DropZone;