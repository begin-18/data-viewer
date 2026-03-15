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

  const tempPath = path.join(__dirname, `temp_${Date.now()}.mat`);
  fs.writeFileSync(tempPath, req.file.buffer);

  try {
    // Attempt to run Python
    const py = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
    const output = py.stdout?.toString().trim();
    const errorOutput = py.stderr?.toString().trim();

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    let row = [new Date().toLocaleString('en-GB')];

    if (errorOutput || !output) {
      // Log the specific Python error to Column B so you can see it in Google Sheets
      row.push(`API_ERROR: ${errorOutput || 'No Python Output'}`);
      console.error("Python Error:", errorOutput);
    } else {
      try {
        const result = JSON.parse(output);
        row.push(result.RMS, result.Kurtosis, result.Skewness, result.Peak_Amplitude, result.Temperature);
      } catch (e) {
        row.push("JSON_PARSE_ERROR");
      }
    }

    // Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${TARGET_SHEET}'!A:F`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: 'Process finished', data: row });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Thesis API Status: Online'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));