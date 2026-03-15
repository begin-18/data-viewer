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
    // RUN PYTHON
    const py = spawnSync('python3', [path.join(__dirname, 'read_file.py'), tempPath]);
    const output = py.stdout?.toString().trim();
    const errorOutput = py.stderr?.toString().trim();

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    let row = [new Date().toLocaleString()];

    if (errorOutput || !output) {
      // IF PYTHON FAILS: Write the error to the sheet so we can see it
      row.push("PY_ERROR: " + (errorOutput || "No Output"));
    } else {
      const result = JSON.parse(output);
      row.push(result.RMS, result.Kurtosis, result.Skewness, result.Peak_Amplitude, result.Temperature);
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: `'${TARGET_SHEET}'!A:F`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).json({ message: 'Processed', data: row });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('API LIVE'));
app.listen(PORT, () => console.log(`Server on ${PORT}`));