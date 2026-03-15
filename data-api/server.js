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

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Google Sheets Auth
const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const TARGET_SHEET = "New Data Storage";

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);

  try {
    fs.writeFileSync(tempPath, req.file.buffer);

    // Render uses Linux, so we use 'python3'
    const pythonBin = process.platform === "win32" ? "python" : "python3"; 

    const py = spawnSync(pythonBin, [path.join(__dirname, 'read_file.py'), tempPath]);
    
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    const output = py.stdout?.toString().trim();
    const errorOutput = py.stderr?.toString().trim();

    if (errorOutput) console.error("PYTHON ERROR:", errorOutput);

    if (!output) {
      return res.status(500).json({ message: "Python script failed", error: errorOutput });
    }

    const pyResult = JSON.parse(output);
    const timestamp = new Date().toLocaleString('en-GB'); 
    
    // Mapping 6 columns: Timestamp, RMS, Kurtosis, Skewness, Peak, Temp
    const row = [
      timestamp,                  
      pyResult.RMS || 0,          
      pyResult.Kurtosis || 0,     
      pyResult.Skewness || 0,     
      pyResult.Peak_Amplitude || 0, 
      pyResult.Temperature || 0   
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${TARGET_SHEET}'!A:F`, 
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    res.status(200).json({ message: 'Upload Successful', data: pyResult });

  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Friendly home page for the browser
app.get('/', (req, res) => res.send('Thesis API is Online'));

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));