import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export default function TempParseFolha() {
  const [data, setData] = useState<Record<string, any[][]> | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch('/temp_folha.xlsx');
      const buffer = await response.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const result: Record<string, any[][]> = {};
      for (const name of wb.SheetNames) {
        const ws = wb.Sheets[name];
        result[name] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      }
      setData(result);
    })();
  }, []);

  if (!data) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 11 }}>
      {Object.entries(data).map(([sheet, rows]) => (
        <div key={sheet}>
          <h2 style={{ marginTop: 20 }}>===== {sheet} =====</h2>
          {rows.slice(0, 60).map((row, i) => (
            <div key={i}>{JSON.stringify(row)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
