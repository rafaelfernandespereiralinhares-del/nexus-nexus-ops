// Temporary script to parse the uploaded FOLHA xlsx file
// Run this in browser console on any page of the app

import * as XLSX from 'xlsx';

export async function parseUploadedFolha(): Promise<Record<string, any[][]>> {
  const response = await fetch('/temp_folha.xlsx');
  const buffer = await response.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  
  const result: Record<string, any[][]> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    result[name] = rows;
  }
  
  return result;
}
