require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const allowedOrigins = [
  'http://localhost:5173',        // local frontend for testing
  'https://begin-18.github.io',   // deployed frontend
];

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman) or from allowedOrigins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed from ${origin}`));
    }
  },
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());

// Multer storage
const upload = multer({ dest: "uploads/" });

// --- Google Sheets setup ---
const auth = new google.auth.JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Sheet mapping
const SHEET_MAPPING = {
    'THERMAL': process.env.THERMAL_SHEET_NAME,
    'ACOUSTIC': process.env.ACOUSTIC_SHEET_NAME,
    'VIBRATION': process.env.VIBRATION_SHEET_NAME,
};

// --- CSV parser ---
async function parseCsvBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const rows = [];
        const readable = Readable.from(buffer.toString());
        let headersPushed = false;

        readable
            .pipe(csv())
            .on('headers', (headers) => {
                if (!headersPushed) {
                    rows.push(headers);
                    headersPushed = true;
                }
            })
            .on('data', (data) => {
                if (rows.length > 0) {
                    const headers = rows[0];
                    rows.push(headers.map(header => data[header] || ''));
                } else {
                    rows.push(Object.values(data));
                }
            })
            .on('end', () => {
                if (rows.length < 1 || (rows.length === 1 && rows[0].length === 0)) {
                    return reject(new Error("File is empty or could not be parsed."));
                }
                resolve(rows);
            })
            .on('error', reject);
    });
}

// --- Append data to Google Sheets ---
async function appendDataToSheet(sheetName, values) {
    const range = `${sheetName}!A:Z`;
    const valuesToAppend = values.slice(1);

    if (valuesToAppend.length === 0) {
        console.warn(`[WARNING] No data rows to append.`);
        return { updates: { updatedRows: 0, updatedCells: 0 } };
    }

    const request = {
        spreadsheetId: process.env.SHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: valuesToAppend },
    };

    const response = await sheets.spreadsheets.values.append(request);
    return response.data;
}

// --- Upload API ---
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { dataType } = req.body;
    const sheetName = SHEET_MAPPING[dataType];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    if (!sheetName) return res.status(400).json({ message: `Invalid data type: ${dataType}` });

    try {
        let values;

        // --- CSV / TXT ---
        if (fileExtension === 'csv' || fileExtension === 'txt') {
            values = await parseCsvBuffer(req.file.buffer);
        }

        // --- JSON ---
        else if (fileExtension === 'json') {
            const jsonData = JSON.parse(req.file.buffer.toString());
            if (jsonData.length > 0) {
                const headers = Object.keys(jsonData[0]);
                const dataRows = jsonData.map(obj => headers.map(h => obj[h]));
                values = [headers, ...dataRows];
            } else return res.status(400).json({ message: 'JSON file is empty.' });
        }

        // --- XLSX ---
        else if (fileExtension === 'xlsx') {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            values = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            if (!values || values.length === 0) return res.status(400).json({ message: 'XLSX file empty.' });
        }

        // --- MAT / TDMS (filename parsing) ---
        else if (fileExtension === 'mat' || fileExtension === 'tdms') {
            const filename = req.file.originalname;
            const parts = filename.split("_");

            const torque = parts[0].replace("Nm", "");
            const condition = parts[1];
            const magnitude = parts[2] ? parts[2].replace(/(mg|\.mat|\.tdms)/gi,"") : "";

            values = [
                ['Timestamp','Torque','Condition','Magnitude'],
                [new Date().toISOString(), torque, condition, magnitude]
            ];

            console.log(`[INFO] Parsed ${filename} → Torque:${torque}, Condition:${condition}, Magnitude:${magnitude}`);
        }

        // --- WAV / MP3 metadata ---
        else if (fileExtension === 'wav' || fileExtension === 'mp3') {
            values = [
                ['Timestamp','Filename','Size','MIME Type'],
                [new Date().toISOString(), req.file.originalname, `${req.file.size} bytes`, req.file.mimetype]
            ];
        }

        // --- Unsupported ---
        else return res.status(400).json({ message: `Unsupported file type: ${fileExtension}` });

        // --- Sanitize rows ---
        const headers = values[0];
        const dataRows = values.slice(1);
        const sanitizedRows = dataRows.filter(row =>
            Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
        values = [headers, ...sanitizedRows];

        // --- Append to Google Sheets ---
        const result = await appendDataToSheet(sheetName, values);
        console.log(`[SUCCESS] Uploaded ${result.updates.updatedRows} rows to ${sheetName}`);
        res.status(200).json({ message: 'Data successfully uploaded.' });

    } catch (error) {
        console.error('[ERROR]', error.message);
        res.status(500).json({ message: `Upload failed. Error: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});