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

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Permanent CORS Configuration
app.use(cors({
  origin: "https://begin-18.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// --- NEW CLEAR DATA ROUTE ---
app.post('/api/clear-sheets', async (req, res) => {
  try {
    const rangesToClear = [
      "'Vibration'!A2:Z",
      "'Acoustic'!A2:Z",
      "'Thermal'!A2:Z"
    ];

    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: process.env.SHEET_ID,
      resource: { ranges: rangesToClear },
    });

    res.status(200).json({ message: "Sheets cleared successfully" });
  } catch (err) {
    console.error("Clear Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  // 1. GET THE MAPPING FROM THE FRONTEND
  const { mapping } = req.body; 
  console.log("DEBUG: Frontend sent mapping as:", mapping);
  // 2. DYNAMICALLY SELECT THE TAB
  let targetTab;
  switch (mapping) {
    case 'Vibration Data':
    case 'Vibration':
      targetTab = 'Vibration';
      break;
    case 'Acoustic Data':
    case 'Acoustic':
      targetTab = 'Acoustic';
      break;
    case 'Thermal Data':
    case 'Thermal':
      targetTab = 'Thermal';
      break;
    default:
      targetTab = 'Mat Data'; // Fallback target
  }

  const originalExt = path.extname(req.file.originalname).toLowerCase(); 
  const tempPath = path.join(__dirname, `temp_${Date.now()}${originalExt}`);
  
  fs.writeFileSync(tempPath, req.file.buffer);

  try {
    const py = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
    const output = py.stdout?.toString().trim();
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    if (!output) throw new Error("Python script returned no output");
    
    const result = JSON.parse(output);
    if (result.error) throw new Error(result.error);

    const row = [
      new Date().toLocaleString('en-US'),
      result.RMS,
      result.Kurtosis,
      result.Skewness,
      result.Peak_Amplitude,
      result.Temperature,
      result.Status || "Normal",
      req.file.originalname
    ];

    // 3. USE THE DYNAMIC targetTab VARIABLE HERE
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${targetTab}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ ...result, savedTo: targetTab });
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 API active on http://localhost:${PORT}`));