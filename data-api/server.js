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

// --- CORS & Middleware ---
const allowedOrigins = ['http://localhost:5173', 'https://begin-18.github.io'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS not allowed from ${origin}`));
  }
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- Google Sheets Auth ---
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

// --- Helpers ---
function formatDateExcelStyle(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

async function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer.toString()).pipe(csv())
      .on('headers', h => rows.push(h))
      .on('data', d => rows.push(Object.values(d)))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function appendToSheet(sheetName, values) {
  if (values.length <= 1) return;
  return sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: values.slice(1) },
  });
}

// --- Main Upload API ---
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { dataType } = req.body;
  const sheetName = SHEET_MAPPING[dataType];
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let values = [];

    if (ext === '.csv' || ext === '.txt') {
      values = await parseCsvBuffer(req.file.buffer);
    } 
    else if (ext === '.xlsx') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      values = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    } 
    else if (ext === '.mat' || ext === '.tdms') {
      // 1. Create temp file
      const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);
      fs.writeFileSync(tempPath, req.file.buffer);

      // 2. Locate Python in VENV (Cross-platform)
      const isWin = process.platform === "win32";
      const pythonBin = isWin 
        ? path.join(__dirname, 'venv', 'Scripts', 'python.exe') 
        : path.join(__dirname, 'venv', 'bin', 'python');

      // 3. Run Python
      const py = spawnSync(pythonBin, ['read_file.py', tempPath]);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      const output = py.stdout.toString().trim();
      if (!output) throw new Error(`Python Error: ${py.stderr.toString()}`);

      const pyResult = JSON.parse(output);
      if (pyResult.error) throw new Error(pyResult.error);

      // 4. Transform for Sheets
      const headers = Object.keys(pyResult);
      const dataCols = Object.values(pyResult);
      const rowCount = Math.max(...dataCols.map(c => Array.isArray(c) ? c.length : 1));
      
      values.push(headers);
      for (let i = 0; i < rowCount; i++) {
        values.push(headers.map((_, colIdx) => {
          const colData = dataCols[colIdx];
          return Array.isArray(colData) ? (colData[i] ?? '') : (i === 0 ? colData : '');
        }));
      }
    } 
    else if (['.wav', '.mp3'].includes(ext)) {
      values = [
        ['Timestamp', 'Filename', 'Size'],
        [formatDateExcelStyle(new Date()), req.file.originalname, `${req.file.size} bytes`]
      ];
    }

    if (values.length > 0) {
      await appendToSheet(sheetName, values);
      res.status(200).json({ message: 'Upload successful' });
    } else {
      res.status(400).json({ message: 'No data extracted' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));