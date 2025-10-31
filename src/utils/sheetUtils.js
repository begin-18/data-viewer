export function parseGvizText(gvizText) {
  const start = gvizText.indexOf("{");
  const end = gvizText.lastIndexOf("}");
  const payload = JSON.parse(gvizText.slice(start, end + 1));
  const cols = (payload.table.cols || []).map(c => (c.label || c.id || "").toLowerCase());
  const rows = (payload.table.rows || []).map(r => {
    const obj = {};
    (r.c || []).forEach((cell, i) => (obj[cols[i]] = cell?.v ?? null));
    return obj;
  });
  return rows;
}
