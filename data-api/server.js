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

// --- SINGLE STORAGE CONFIG ---
const TARGET_SHEET = "New Data Storage";

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const tempPath = path.join(__dirname, `temp_${Date.now()}${ext}`);

  try {
    let values = [];

    if (ext === '.mat' || ext === '.tdms') {
      fs.writeFileSync(tempPath, req.file.buffer);

      // Pathing for Windows vs Linux (Render)
      const isWin = process.platform === "win32";
      const pythonBin = isWin 
        ? path.join(__dirname, 'venv', 'Scripts', 'python.exe') 
        : "python3"; 

      const py = spawnSync(pythonBin, [path.join(__dirname, 'read_file.py'), tempPath]);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      const output = py.stdout?.toString().trim() || "";
      const errorOutput = py.stderr?.toString().trim() || "";

      if (!output) {
        console.error("PYTHON ERROR:", errorOutput);
        return res.status(500).json({ message: "Extraction failed", details: errorOutput });
      }

      const pyResult = JSON.parse(output);
      const timestamp = new Date().toLocaleString('en-GB'); 
      
      // The Professional Mapping (Matches Sheet Columns A-F)
      const row = [
        timestamp,                  
        pyResult.RMS || 0,          
        pyResult.Kurtosis || 0,     
        pyResult.Skewness || 0,     
        pyResult.Peak_Amplitude || 0, 
        pyResult.Temperature || 0   
      ];

      values = [row];
    } else {
        return res.status(400).json({ message: "Please upload a .mat or .tdms file." });
    }

    if (values.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: `'${TARGET_SHEET}'!A:F`, 
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: values },
      });
      res.status(200).json({ message: 'Upload Successful', data: values[0] });
    }

  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("UPLOAD ERROR:", err.message);
    res.status(500).json({ message: "Server Error", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));