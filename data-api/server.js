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

const allowedOrigins = [
  'http://localhost:5173',
  'https://begin-18.github.io',
];

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS not allowed from ${origin}`));
  },
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());

// --- Multer memory storage ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Google Sheets setup ---
const auth = new google.auth.JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY.replace(/\\n/g,'\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// --- Sheet mapping ---
const SHEET_MAPPING = {
  'THERMAL': process.env.THERMAL_SHEET_NAME,
  'ACOUSTIC': process.env.ACOUSTIC_SHEET_NAME,
  'VIBRATION': process.env.VIBRATION_SHEET_NAME,
};

// --- Excel-style timestamp ---
function formatDateExcelStyle(date){
  const yyyy=date.getFullYear();
  const mm=String(date.getMonth()+1).padStart(2,'0');
  const dd=String(date.getDate()).padStart(2,'0');
  const hh=String(date.getHours()).padStart(2,'0');
  const min=String(date.getMinutes()).padStart(2,'0');
  const ss=String(date.getSeconds()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// --- CSV parser ---
async function parseCsvBuffer(buffer){
  return new Promise((resolve,reject)=>{
    const rows=[];
    const readable=Readable.from(buffer.toString());
    let headersPushed=false;
    readable.pipe(csv())
      .on('headers', headers=>{ if(!headersPushed){rows.push(headers); headersPushed=true;} })
      .on('data', data=>{ 
        if(rows.length>0){ const h=rows[0]; rows.push(h.map(k=>data[k]||'')); }
        else rows.push(Object.values(data));
      })
      .on('end', ()=>{ if(rows.length<1||(rows.length===1 && rows[0].length===0)) reject(new Error('File empty')); else resolve(rows); })
      .on('error', reject);
  });
}

// --- Append to Google Sheet ---
async function appendDataToSheet(sheetName, values){
  const range = `${sheetName}!A:Z`;
  const valuesToAppend = values.slice(1);
  if(valuesToAppend.length===0) return { updates:{updatedRows:0,updatedCells:0} };

  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range,
    valueInputOption:'USER_ENTERED',
    insertDataOption:'INSERT_ROWS',
    resource:{values:valuesToAppend},
  };

  return await sheets.spreadsheets.values.append(request);
}

// --- Upload API ---
app.post('/api/upload-data', upload.single('file'), async (req,res)=>{
  if(!req.file) return res.status(400).json({message:'No file uploaded'});
  const {dataType} = req.body;
  const sheetName=SHEET_MAPPING[dataType];
  if(!sheetName) return res.status(400).json({message:`Invalid data type: ${dataType}`});
  const fileExtension=req.file.originalname.split('.').pop().toLowerCase();

  try{
    let values;

    // CSV/TXT
    if(fileExtension==='csv'||fileExtension==='txt'){
      values=await parseCsvBuffer(req.file.buffer);
    }
    // JSON
    else if(fileExtension==='json'){
      const jsonData=JSON.parse(req.file.buffer.toString());
      if(jsonData.length>0){
        const headers=Object.keys(jsonData[0]);
        const rows=jsonData.map(obj=>headers.map(h=>obj[h]));
        values=[headers,...rows];
      } else return res.status(400).json({message:'JSON empty'});
    }
    // XLSX
    else if(fileExtension==='xlsx'){
      const workbook=XLSX.read(req.file.buffer,{type:'buffer'});
      const wsName=workbook.SheetNames[0];
      const ws=workbook.Sheets[wsName];
      values=XLSX.utils.sheet_to_json(ws,{header:1,raw:false});
      if(!values||values.length===0) return res.status(400).json({message:'XLSX empty'});
    }
    // MAT or TDMS → call Python
    else if(fileExtension==='mat'||fileExtension==='tdms'){
      const tempPath=path.join(__dirname,'temp_file.'+fileExtension);
      fs.writeFileSync(tempPath, req.file.buffer);

      const py=spawnSync('python',['read_file.py',tempPath]);
      const output=py.stdout.toString();
      fs.unlinkSync(tempPath);

      const pyResult=JSON.parse(output);
      if(pyResult.error) return res.status(500).json({message:`${fileExtension.toUpperCase()} parse error: ${pyResult.error}`});

      // Convert JSON to array of arrays for Sheets
      const headers=Object.keys(pyResult);
      const arrs=Object.values(pyResult);
      const maxLen=Math.max(...arrs.map(a=>Array.isArray(a)?a.length:1));
      const rows=[];
      for(let i=0;i<maxLen;i++){
        const row=headers.map((h,idx)=>{
          const v=arrs[idx];
          if(Array.isArray(v)) return v[i]!==undefined?v[i]:'';
          else return v;
        });
        rows.push(row);
      }
      values=[headers,...rows];
    }
    // WAV/MP3
    else if(fileExtension==='wav'||fileExtension==='mp3'){
      values=[
        ['Timestamp','Filename','Size','MIME Type'],
        [formatDateExcelStyle(new Date()), req.file.originalname, `${req.file.size} bytes`, req.file.mimetype]
      ];
    }
    else return res.status(400).json({message:`Unsupported file type: ${fileExtension}`});

    // Sanitize rows
    const headers=values[0];
    const sanitizedRows=values.slice(1).filter(r=>Array.isArray(r) && r.some(c=>c!==null && c!==undefined && String(c).trim()!==''));
    values=[headers,...sanitizedRows];

    // Append to Google Sheets
    await appendDataToSheet(sheetName, values);
    res.status(200).json({message:'Data uploaded successfully'});

  }catch(err){
    console.error('[ERROR]',err);
    res.status(500).json({message:'Upload failed: '+err.message});
  }
});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));