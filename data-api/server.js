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

app.use(cors({ origin: ['https://begin-18.github.io'] }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const auth = new google.auth.JWT({
    email: process.env.CLIENT_EMAIL,
    key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Updated MAPPING to match your exact Google Sheet tab names
const SHEET_MAPPING = {
    'THERMAL': 'Thermal Data',
    'ACOUSTIC': 'Acoustic Data',
    'VIBRATION': 'Vibration Data',
};

async function parseCsvBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const rows = [];
        const readable = Readable.from(buffer.toString());
        let headersPushed = false;
        readable.pipe(csv()).on('headers', (h) => { if (!headersPushed) { rows.push(h); headersPushed = true; } })
            .on('data', (d) => { rows.push(rows.length > 0 ? rows[0].map(h => d[h] || '') : Object.values(d)); })
            .on('end', () => resolve(rows)).on('error', reject);
    });
}

async function appendDataToSheet(sheetName, values) {
    const valuesToAppend = values.slice(1);
    if (valuesToAppend.length === 0) return { updates: { updatedRows: 0 } };
    const request = {
        spreadsheetId: process.env.SHEET_ID,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: valuesToAppend },
    };
    const response = await sheets.spreadsheets.values.append(request);
    return response.data;
}

app.post('/api/upload-data', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const rawDataType = req.body.dataType || "";
    const dataType = rawDataType.toUpperCase(); 
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    let sheetName;
    
    // Logic: .mat and .tdms always go to 'New Data Storage'
    if (fileExtension === 'mat' || fileExtension === 'tdms') {
        sheetName = "New Data Storage";
    } else {
        // CSV/XLSX uses the MAPPING based on the UI selection
        sheetName = SHEET_MAPPING[dataType];
    }

    if (!sheetName) {
        return res.status(400).json({ message: `Sheet mapping not found for: ${dataType}` });
    }

    try {
        let values;

        // --- Standard Spreadsheet Path ---
        if (fileExtension === 'csv' || fileExtension === 'txt') {
            values = await parseCsvBuffer(req.file.buffer);
        } else if (fileExtension === 'xlsx') {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            values = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });
        } 
        // --- Binary Fusion Path (.mat / .tdms) ---
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
                // The 5-column structure for the Fusion model
                values = [['Header'], [timestamp, result.Vib_X, result.Vib_Y, result.Vib_Z, result.Fault_Type]];
            } else {
                throw new Error("Python processing failed.");
            }
        } else {
            return res.status(400).json({ message: `Unsupported file: ${fileExtension}` });
        }

        // --- Clean and Upload ---
        if (values && values.length > 0) {
            const headers = values[0];
            const dataRows = values.slice(1).filter(row => Array.isArray(row) && row.some(c => c && String(c).trim() !== ''));
            await appendDataToSheet(sheetName, [headers, ...dataRows]);
            return res.status(200).json({ message: 'Data successfully uploaded' });
        }

        res.status(400).json({ message: 'Empty file detected.' });

    } catch (error) {
        console.error('[FAILURE]', error.message);
        res.status(500).json({ message: `Upload failed: ${error.message}` });
    }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));