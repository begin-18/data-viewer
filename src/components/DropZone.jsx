import React, { useState } from 'react';
import axios from 'axios';

// IMPORTANT: Ensure this matches your Node.js server URL and route
const API_URL = 'https://thesis-data-gl06.onrender.com/api/upload-data';


const DropZone = ({ dataType, allowedExtensions }) => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState(''); // 'success', 'error', 'loading'
    const [message, setMessage] = useState('');

    const handleFileDrop = (droppedFile) => {
        if (!droppedFile) return;

        const extension = droppedFile.name.split('.').pop().toLowerCase();
        
        // Clear previous state
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
        // Trigger upload immediately as per your original logic
        uploadFile(droppedFile); 
    };

    const uploadFile = async (fileToUpload) => {
        setStatus('loading');

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('dataType', dataType); 

        try {
            const response = await axios.post(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // This runs ONLY if the server returns a 2xx status code
            setStatus('success');
            setFile(null); // Clear file only on confirmed success
            setMessage(response.data.message || `Successfully uploaded ${fileToUpload.name} to Google Sheets.`);
            
        } catch (error) {
            // This runs if the server returns a non-2xx status code (e.g., 400 or 500)
            setStatus('error');
            
            let errorMessage = 'Upload failed. Check server logs.';
            
            if (error.response) {
                // Server returned a status code, so we know the request reached the server.
                const serverStatus = error.response.status;
                const serverMessage = error.response.data?.message;
                
                // Refined message to indicate the potential success of data writing.
                errorMessage = serverMessage 
                    ? `Server Error (${serverStatus}): ${serverMessage}. Data may still be written in Google Sheet.`
                    : `Upload failed (Status ${serverStatus}). Data may still be written in Google Sheet.`;
            } else if (error.request) {
                // The request was made but no response was received (network issue/CORS)
                errorMessage = 'Upload failed: No response received from server. Check network or CORS settings.';
            }

            setMessage(errorMessage);
            console.error('Upload Error:', error);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileDrop(droppedFile);
    };

    const StatusIndicator = () => {
        if (status === 'loading') return <div style={{ color: 'blue' }}>⏳ {message}</div>;
        if (status === 'success') return <div style={{ color: 'green' }}>✅ {message}</div>;
        // The error message now suggests checking the Google Sheet
        if (status === 'error') return <div style={{ color: 'red' }}>❌ {message}</div>;
        return null;
    };

    return (
        <div 
            className={`drop-zone ${dataType.toLowerCase()} ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                border: `2px dashed ${dragging ? '#007bff' : '#ccc'}`,
                padding: '25px',
                textAlign: 'center',
                margin: '15px 0',
                borderRadius: '10px',
                backgroundColor: dragging ? '#f0f8ff' : '#f9f9f9',
                transition: '0.2s',
            }}
        >
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{dataType} DATA</h3>
            <p>Drag & drop your file here, or click to browse.</p>
            <input 
                type="file" 
                onChange={(e) => handleFileDrop(e.target.files[0])} 
                style={{ display: 'none' }} 
                id={`file-upload-${dataType}`}
                accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
            />
            <label 
                htmlFor={`file-upload-${dataType}`} 
                style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
            >
                Browse File
            </label>
            
            <StatusIndicator />
        </div>
    );
};

export default DropZone;