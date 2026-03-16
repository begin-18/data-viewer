require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Permanent CORS Configuration
app.use(cors({
  origin: "https://begin-18.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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
const TARGET_SHEET = "New Data Storage";

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  let row = [new Date().toLocaleString('en-GB')];

  // CASE 1: Processing Physical Files (.mat or .tdms) via Python
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);
    
    fs.writeFileSync(tempPath, req.file.buffer);

    try {
      const py = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
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
            result.Peak_Amplitude || result.PeakAmp,
            result.Temperature,
            result.Status
          );
        } catch (e) {
          row.push("JSON_PARSE_ERROR");
        }
      }
    } catch (err) {
      row.push("PYTHON_SPAWN_ERROR");
    }
  } 
  // CASE 2: Processing Direct JSON (Manual entry or Dashboard Sync)
  else if (req.body && Object.keys(req.body).length > 0) {
    const d = req.body;
    row.push(
      d.RMS || 0,
      d.Kurtosis || 0,
      d.Skewness || 0,
      d.PeakAmp || d.Peak_Amplitude || 0,
      d.Temperature || 0,
      d.Status ?? 0
    );
  } 
  else {
    return res.status(400).json({ message: 'No file or data provided' });
  }

  try {
    // Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${TARGET_SHEET}'!A:G`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: 'Process finished', data: row });

  } catch (err) {
    console.error("Sheets Append Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Thesis API Status: Online'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));