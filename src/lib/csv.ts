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
