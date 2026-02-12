import * as XLSX from 'xlsx';

/**
 * Export an array of objects to CSV and trigger download
 */
export function exportToCSV(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(';');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(';')
  );

  const bom = '\uFEFF';
  const csv = bom + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export an array of objects to Excel (.xlsx) and trigger download
 */
export function exportToExcel(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const headers = cols.map(c => c.label);
  const rows = data.map(row => cols.map(c => row[c.key] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Parse CSV text into array of objects
 */
export function parseCSV(text: string): { rows: Record<string, string>[]; columns: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { rows: [], columns: [] };
  const separator = lines[0].includes(';') ? ';' : ',';
  const columns = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    columns.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
  return { rows, columns };
}

/**
 * Parse an Excel (.xlsx/.xls) file into array of objects
 */
export function parseExcel(buffer: ArrayBuffer): { rows: Record<string, string>[]; columns: string[] } {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (raw.length < 2) return { rows: [], columns: [] };
  const columns = raw[0].map(h => String(h ?? '').trim());
  const rows = raw.slice(1).filter(r => r.some(v => v != null && v !== '')).map(r => {
    const row: Record<string, string> = {};
    columns.forEach((h, i) => { row[h] = String(r[i] ?? '').trim(); });
    return row;
  });
  return { rows, columns };
}
