require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { spawnSync } = require('child_process'); 
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware setup ---
app.use(cors({
    origin: ['https://begin-18.github.io']
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- Google Sheets Authentication ---
const auth = new google.auth.JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Sheet mapping logic
const SHEET_MAPPING = {
    'THERMAL': process.env.THERMAL_SHEET_NAME,
    'ACOUSTIC': process.env.ACOUSTIC_SHEET_NAME,
    'VIBRATION': process.env.VIBRATION_SHEET_NAME,
};

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

async function appendDataToSheet(sheetName, values) {
    const range = `${sheetName}!A:Z`;
    const valuesToAppend = values.slice(1);
    if (valuesToAppend.length === 0) return { updates: { updatedRows: 0 } };

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

// --- API Route ---
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { dataType } = req.body;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    // Determine the sheet: Binary goes to 'New Data Storage', others go to mapped tabs
    let sheetName;
    if (fileExtension === 'mat' || fileExtension === 'tdms') {
        sheetName = "New Data Storage";
    } else {
        sheetName = SHEET_MAPPING[dataType];
    }

    if (!sheetName) {
        return res.status(400).json({ message: `Invalid target sheet for ${dataType}` });
    }

    try {
        let values;

        if (fileExtension === 'csv' || fileExtension === 'txt') {
            values = await parseCsvBuffer(req.file.buffer);
        }
        else if (fileExtension === 'xlsx') {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetNameFromWorkbook = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetNameFromWorkbook];
            values = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        }
        else if (fileExtension === 'mat' || fileExtension === 'tdms') {
            const tempPath = path.join(__dirname, `temp_${Date.now()}.${fileExtension}`);
            fs.writeFileSync(tempPath, req.file.buffer);

            const pyScript = fileExtension === 'tdms' ? 'read_tdms.py' : 'read_file.py';
            const py = spawnSync('python3', [path.join(__dirname, pyScript), tempPath]);
            const output = py.stdout?.toString().trim();
            
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

            if (output) {
                const result = JSON.parse(output);
                const timestamp = new Date().toLocaleString('en-GB');
                
                // Binary data always uses the 5-column vibration format in New Data Storage
                values = [['Header'], [timestamp, result.Vib_X, result.Vib_Y, result.Vib_Z, result.Fault_Type]];
            } else {
                throw new Error("Python processing failed.");
            }
        }
        else {
            return res.status(400).json({ message: `Unsupported file type: ${fileExtension}` });
        }

        // --- SANITIZATION ---
        if (values && values.length > 0) {
            const headers = values[0];
            const dataRows = values.slice(1);
            const sanitizedDataRows = dataRows.filter(row =>
                Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
            );
            values = [headers, ...sanitizedDataRows];
        }

        const result = await appendDataToSheet(sheetName, values);
        res.status(200).json({ message: 'Data successfully uploaded' });

    } catch (error) {
        res.status(500).json({ message: `Upload failed: ${error.message}` });
    }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));