require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
const allowedOrigins = ['http://localhost:5173', 'https://begin-18.github.io'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS error: ${origin} not allowed`));
  }
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- Google Auth ---
const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_MAPPING = {
  'THERMAL': process.env.THERMAL_SHEET_NAME,
  'ACOUSTIC': process.env.ACOUSTIC_SHEET_NAME,
  'VIBRATION': process.env.VIBRATION_SHEET_NAME,
};

// --- Main API ---
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  const { dataType } = req.body;
  const sheetName = SHEET_MAPPING[dataType];
  if (!sheetName) return res.status(400).json({ message: 'Invalid data type' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);

  try {
    let values = [];

    // 1. Handling CSV/Excel/Text
    if (ext === '.csv' || ext === '.txt') {
      const rows = [];
      await new Promise((resolve, reject) => {
        Readable.from(req.file.buffer.toString()).pipe(csv())
          .on('headers', h => rows.push(h))
          .on('data', d => rows.push(Object.values(d)))
          .on('end', resolve)
          .on('error', reject);
      });
      values = rows;
    } 
    else if (ext === '.xlsx') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      values = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    }
    // 2. Handling Engineering Files (.mat / .tdms)
    else if (ext === '.mat' || ext === '.tdms') {
      // Create physical temp file for Python to read
      fs.writeFileSync(tempPath, req.file.buffer);

      // --- DUAL ENVIRONMENT LOGIC ---
      const isWin = process.platform === "win32";
      const pythonBin = isWin 
        ? path.join(__dirname, 'venv', 'Scripts', 'python.exe') 
        : "python3"; 

      // Run the Python script
      const py = spawnSync(pythonBin, [path.join(__dirname, 'read_file.py'), tempPath]);
      
      // Cleanup temp file immediately after Python finishes
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      // --- SAFE STRING HANDLING ---
      const output = py.stdout?.toString().trim() || "";
      const errorOutput = py.stderr?.toString().trim() || "";

      if (!output) {
        console.error("Python Error Details:", errorOutput);
        return res.status(500).json({ 
          message: "Python script failed to process file.", 
          details: errorOutput || "No output returned from Python." 
        });
      }

      const pyResult = JSON.parse(output);
      if (pyResult.error) throw new Error(pyResult.error);

      // Transform JSON to 2D Array for Google Sheets
      const headers = Object.keys(pyResult);
      const columns = Object.values(pyResult);
      const rowCount = Math.max(...columns.map(c => Array.isArray(c) ? c.length : 1));

      values.push(headers);
      for (let i = 0; i < rowCount; i++) {
        values.push(headers.map((_, colIdx) => {
          const colData = columns[colIdx];
          return Array.isArray(colData) ? (colData[i] ?? '') : (i === 0 ? colData : '');
        }));
      }
    }
    // 3. Audio Metadata
    else if (['.wav', '.mp3'].includes(ext)) {
      values = [
        ['Timestamp', 'Filename', 'Size'],
        [new Date().toISOString(), req.file.originalname, `${req.file.size} bytes`]
      ];
    }

    // --- Final Upload to Google Sheets ---
    if (values.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: `${sheetName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: values.slice(1) }, // Appends data without repeating headers
      });
      res.status(200).json({ message: 'Upload Successful' });
    } else {
      res.status(400).json({ message: 'No data extracted from file.' });
    }

  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("[SERVER ERROR]:", err.message);
    res.status(500).json({ message: "Internal Server Error", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));