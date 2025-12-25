// src/components/DataUploadPage.jsx
import React from 'react';
import DropZone from './DropZone';

const DataUploadPage = ({ currentTheme }) => {
    // Styling the container to match the application's theme and card aesthetic
    
    return (
        <div 
            className="data-upload-container" 
            style={{ 
                padding: '30px', 
                maxWidth: '900px', 
                margin: '0 auto', 
                borderRadius: 12, 
                
            }}
        >
            <h2>Upload Data for Processing 📤</h2>
            <p style={{color: currentTheme.textColor}}>Select or drag your data files into the corresponding zones below. Files will be parsed and stored in the dedicated Google Sheet tabs.</p>
            
            <hr style={{borderColor: currentTheme.border}} />

            {/* Thermal Data Zone - Now allows .xlsx */}
            <DropZone 
                dataType="THERMAL" 
                allowedExtensions={['csv', 'json', 'txt', 'xlsx']} 
            />

            {/* Acoustic Data Zone - Now allows .xlsx */}
            <DropZone 
                dataType="ACOUSTIC" 
                allowedExtensions={['wav', 'mp3', 'csv', 'xlsx']} 
            />

            {/* Vibration Data Zone - Allows .xlsx */}
            <DropZone 
                dataType="VIBRATION" 
                allowedExtensions={['csv', 'xlsx', 'txt']} 
            />

        </div>
    );
};

export default DataUploadPage;