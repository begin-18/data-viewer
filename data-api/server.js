const express = require('express');
const multer = require('multer');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-data', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    // UNIQUE FILE IDENTIFIER: Prevents the "Loop/Stuck" data problem
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const tempPath = path.join(__dirname, `upload_${uniqueId}.mat`);

    try {
        // Write the buffer to a unique physical file for Python to read
        fs.writeFileSync(tempPath, req.file.buffer);

        // Run the Python Analyzer
        const pyProcess = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
        
        const output = pyProcess.stdout.toString();
        if (!output) throw new Error("Python script returned no data");

        const result = JSON.parse(output);

        // CLEANUP: Delete the file immediately after reading
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        // Send JSON back to Frontend (including Skewness)
        res.json(result);

    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error("Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Active on Port ${PORT}`));