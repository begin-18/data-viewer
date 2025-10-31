// src/utils.js

// Pick first non-null, non-empty value from keys
export function pick(obj, keys) {
  for (const k of keys) if (obj[k] != null && obj[k] !== "") return obj[k];
  return "";
}

// Normalize timestamp to {date, time, raw}
export function normalizeTimestampToParts(raw) {
  if (!raw) return { date: "", time: "", raw };
  if (raw instanceof Date) return { date: formatDate(raw), time: formatTime(raw), raw };
  const str = String(raw).trim();
  if (str.startsWith("Date(")) {
    const parts = str.match(/Date\(([^)]+)\)/)[1].split(",").map(Number);
    const d = new Date(parts[0], parts[1], parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
    return { date: formatDate(d), time: formatTime(d), raw };
  }
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return { date: formatDate(serialToDate(Number(str))), time: formatTime(serialToDate(Number(str))), raw };
  }
  const parsed = new Date(str);
  if (!isNaN(parsed)) return { date: formatDate(parsed), time: formatTime(parsed), raw };
  return { date: str, time: "", raw };
}

// Convert Excel serial date to JS date
function serialToDate(serial) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.UTC(1899, 11, 30) + serial * msPerDay);
}

// Helpers for formatting
function pad(n, l = 2) { return String(n).padStart(l, "0"); }
function formatDate(d) { if (!d) return ""; return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function formatTime(d) { if (!d) return ""; return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

// Parse Google Visualization JSON
export function parseGvizText(gvizText) {
  const start = gvizText.indexOf("{");
  const end = gvizText.lastIndexOf("}");
  const payload = JSON.parse(gvizText.slice(start, end + 1));
  const cols = (payload.table.cols || []).map(c => (c.label || c.id || "").toLowerCase());
  const rows = (payload.table.rows || []).map(r => {
    const obj = {};
    (r.c || []).forEach((cell, i) => obj[cols[i]] = cell?.v ?? null);
    return obj;
  });
  return rows;
}
