require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');
const csv = require('csv-parser');
const XLSX = require('xlsx'); 

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware setup ---
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

// Multer setup: use memory storage to handle the file buffer
const upload = multer({ storage: multer.memoryStorage() });

// --- Google Sheets Authentication and Service ---
const auth = new google.auth.JWT({
    email: process.env.CLIENT_EMAIL,
    // Ensure PRIVATE_KEY is loaded correctly
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

/**
 * Parses the CSV buffer into an array of arrays for the Sheets API.
 */
async function parseCsvBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const rows = [];
        const readable = Readable.from(buffer.toString()); 
        let headersPushed = false;
        
        readable
            .pipe(csv())
            .on('headers', (headers) => {
                if (!headersPushed) {
                    rows.push(headers); // Push headers as the first row
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

/**
 * Appends data to the specified Google Sheet tab.
 */
async function appendDataToSheet(sheetName, values) {
    const range = `${sheetName}!A:Z`; // Target range for appending
    
    // We skip the header row, as it's assumed to already exist in the sheet
    const valuesToAppend = values.slice(1);
    
    console.log(`[DEBUG] Attempting to append ${valuesToAppend.length} rows to sheet: ${sheetName}`);

    // --- CRITICAL FIX: Graceful handling of zero data rows to prevent server crash/hang ---
    if (valuesToAppend.length === 0) {
        console.warn(`[WARNING] No data rows found after sanitization. Returning 0 rows written.`);
        // Return a successful object instead of throwing an error
        return { updates: { updatedRows: 0, updatedCells: 0 } };
    }
    // --- END CRITICAL FIX ---
    
    const request = {
        spreadsheetId: process.env.SHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: valuesToAppend,
        },
    };

    const response = await sheets.spreadsheets.values.append(request);
    return response.data;
}


// --- API Route ---
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { dataType } = req.body;
    const sheetName = SHEET_MAPPING[dataType];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    if (!sheetName) {
        return res.status(400).json({ message: `Invalid data type specified: ${dataType}` });
    }

    try {
        let values; 

        if (fileExtension === 'csv' || fileExtension === 'txt') {
            values = await parseCsvBuffer(req.file.buffer);

        } else if (fileExtension === 'json') {
            const jsonData = JSON.parse(req.file.buffer.toString());
            if (jsonData.length > 0) {
                const headers = Object.keys(jsonData[0]);
                const dataRows = jsonData.map(obj => headers.map(header => obj[header]));
                values = [headers, ...dataRows];
            } else {
                return res.status(400).json({ message: 'JSON file is empty.' });
            }

        } else if (fileExtension === 'xlsx') { 
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetNameFromWorkbook = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetNameFromWorkbook];
            values = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }); 
            
            if (!values || values.length === 0) {
                return res.status(400).json({ message: 'XLSX file is empty or could not be parsed.' });
            }

        } else if (fileExtension === 'wav' || fileExtension === 'mp3') {
            // For specified binary files (.wav, .mp3), just log metadata
            values = [
                ['Timestamp', 'Filename', 'Size', 'MIME Type'], 
                [new Date().toISOString(), req.file.originalname, `${req.file.size} bytes`, req.file.mimetype]
            ];
            console.log(`Received binary file: ${req.file.originalname}. Only logging metadata.`);

        } else {
            // Catch-all for unsupported files
            return res.status(400).json({ message: `Unsupported file type: ${fileExtension}` });
        }

        // --- SANITIZATION STEP: Filter out empty rows ---
        if (values && values.length > 0) {
            const headers = values[0];
            const dataRows = values.slice(1);

            // Filter out rows that are completely empty to prevent errors during append
            const sanitizedDataRows = dataRows.filter(row => 
                Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
            );
            
            values = [headers, ...sanitizedDataRows];
        }
        
        // Write the data to the Google Sheet
        const result = await appendDataToSheet(sheetName, values);

        // --- SUCCESS LOG FOR CONFIRMATION ---
        console.log(`[SUCCESS] Data uploaded and ${result.updates.updatedRows} rows written to sheet: ${sheetName}`);

        // This response is now guaranteed to execute successfully after the sheet operation
        res.status(200).json({ 
            message: `Data successfully uploaded`,
        });
            // message: `Data successfully uploaded to : ${sheetName}. ${result.updates.updatedRows} data row(s) written.`,
    } catch (error) {
        // --- FAILURE LOG ---
        console.error('[FAILURE] Processing or Google Sheet Error:', error.message);
        res.status(500).json({ 
            message: `Upload failed. Check server logs for details. Error: ${error.message}` 
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});