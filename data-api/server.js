require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "https://begin-18.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

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

  // Column A: Date and Time
  let row = [new Date().toLocaleString('en-GB')];

  try {
    // --- BRANCH 1: SPREADSHEETS (CSV/XLSX) ---
    if (fileExt === '.csv' || fileExt === '.xlsx') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (data[1]) {
        if (sensorType === 'vibration') {
          // Vibration: [Timestamp, Vib_X, Vib_Y, Vib_Z, Fault_Type] (5 columns total)
          row.push(...data[1].slice(0, 4)); 
        } else {
          // Thermal/Acoustic: [Timestamp, Value, Fault_Type] (3 columns total)
          row.push(...data[1].slice(0, 2)); 
        }
      }
    } 
    
    // --- BRANCH 2: COMPLEX FILES (MAT/TDMS) ---
    else if (fileExt === '.mat' || fileExt === '.tdms') {
      const tempPath = path.join(__dirname, `temp_${Date.now()}${fileExt}`);
      fs.writeFileSync(tempPath, req.file.buffer);

      const pyScript = fileExt === '.tdms' ? 'read_tdms.py' : 'read_file.py';
      const py = spawnSync('python3', [path.join(__dirname, pyScript), tempPath]);
      const output = py.stdout?.toString().trim();
      
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      if (output) {
        try {
          const result = JSON.parse(output);
          if (sensorType === 'vibration') {
            row.push(result.Vib_X, result.Vib_Y, result.Vib_Z, result.Fault_Type);
          } else if (sensorType === 'thermal') {
            row.push(result.Temperature, result.Fault_Type);
          } else if (sensorType === 'acoustic') {
            row.push(result.Acoustic_Level, result.Fault_Type);
          }
        } catch (e) {
          row.push("JSON_PARSE_ERROR");
        }
      } else {
        row.push("PYTHON_ERROR");
      }
    }

    // --- SAVE TO GOOGLE SHEETS ---
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${targetSheetName}'!A:E`, // Range A:E covers up to 5 columns
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: `Successfully saved to ${targetSheetName}`, data: row });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Thesis API Status: Online'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));