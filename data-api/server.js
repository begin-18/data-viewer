require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx'); // Added for CSV/XLSX support

const app = express();
const PORT = process.env.PORT || 5000;

// FIXED: Explicit CORS for GitHub Pages
app.use(cors({
  origin: "https://begin-18.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// Google Sheets Setup
const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// SHEET MAPPING based on your UI categories
const SHEET_MAP = {
  vibration: "Vibration Data",
  acoustic: "Acoustic Data",
  thermal: "Thermal Data"
};

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const fileExt = path.extname(req.file.originalname).toLowerCase();
  const sensorType = req.body.sensorType?.toLowerCase() || 'vibration';
  const targetSheetName = SHEET_MAP[sensorType] || "New Data Storage";

  let row = [new Date().toLocaleString('en-GB'), fileExt.toUpperCase()];

  try {
    // --- BRANCH 1: SPREADSHEETS (CSV/XLSX) ---
    if (fileExt === '.csv' || fileExt === '.xlsx') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      // Pull first 6 columns from the second row of the spreadsheet
      if (data[1]) {
        row.push(...data[1].slice(0, 6)); 
      }
    } 
    
    // --- BRANCH 2: COMPLEX FILES (MAT/TDMS) ---
    else if (fileExt === '.mat' || fileExt === '.tdms') {
      const tempPath = path.join(__dirname, `temp_${Date.now()}${fileExt}`);
      fs.writeFileSync(tempPath, req.file.buffer);

      const pyScript = fileExt === '.tdms' ? 'read_tdms.py' : 'read_file.py';
      const py = spawnSync('python3', [path.join(__dirname, pyScript), tempPath]);
      const output = py.stdout?.toString().trim();
      const errorOutput = py.stderr?.toString().trim();

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      if (errorOutput || !output) {
        row.push(`API_ERROR: ${errorOutput || 'No Python Output'}`);
      } else {
        try {
          const result = JSON.parse(output);
          row.push(
            result.RMS, 
            result.Kurtosis, 
            result.Skewness, 
            result.Peak_Amplitude, 
            result.Temperature,
            result.Status
          );
        } catch (e) {
          row.push("JSON_PARSE_ERROR");
        }
      }
    }

    // Append to the specific target sheet based on sensor type
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${targetSheetName}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: `Saved to ${targetSheetName}`, data: row });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Thesis API Status: Online'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));