const express = require('express');
const multer = require('multer');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Required to fix the browser block

const app = express();

// --- CORS CONFIGURATION ---
app.use(cors({
    origin: 'https://begin-18.github.io', // Your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-data', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    // UNIQUE FILE NAME: Prevents the "stuck data" loop
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const tempPath = path.join(__dirname, `upload_${uniqueId}.mat`);

    try {
        fs.writeFileSync(tempPath, req.file.buffer);

        // Run Python Analyzer
        const pyProcess = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
        
        const output = pyProcess.stdout.toString();
        if (!output) throw new Error("Python script returned no data. Check Render logs.");

        const result = JSON.parse(output);

        // CLEANUP: Delete file after processing
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        res.json(result);

    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error("Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));