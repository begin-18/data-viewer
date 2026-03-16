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

// Update this to your actual GitHub Pages URL
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
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Detect extension (.mat or .tdms) to create correct temp file
  const ext = path.extname(req.file.originalname).toLowerCase();
  const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);
  
  fs.writeFileSync(tempPath, req.file.buffer);

  try {
    // Run Python script
    const py = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
    const output = py.stdout?.toString().trim();
    const errorOutput = py.stderr?.toString().trim();

    // Clean up temp file
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    let row = [new Date().toLocaleString('en-GB')];

    if (errorOutput || !output) {
      row.push(`API_ERROR: ${errorOutput || 'No Python Output'}`);
    } else {
      try {
        const result = JSON.parse(output);
        // Column mapping: A=Time, B=RMS, C=Kurtosis, D=Skewness, E=Peak, F=Temp, G=Status
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

    // Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${TARGET_SHEET}'!A:G`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: 'Process finished', data: row });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Thesis API Status: Online'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));