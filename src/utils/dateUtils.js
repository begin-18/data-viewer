export const pad = (n, l = 2) => String(n).padStart(l, "0");

export function formatDate(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(d) {
  if (!d) return "";
  return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function serialToDate(serial) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.UTC(1899, 11, 30) + serial * msPerDay);
}

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
    const d = serialToDate(Number(str));
    return { date: formatDate(d), time: formatTime(d), raw };
  }
  const parsed = new Date(str);
  if (!isNaN(parsed)) return { date: formatDate(parsed), time: formatTime(parsed), raw };
  return { date: str, time: "", raw };
}

export const pick = (obj, keys) => {
  for (const k of keys) if (obj[k] != null && obj[k] !== "") return obj[k];
  return "";
};
