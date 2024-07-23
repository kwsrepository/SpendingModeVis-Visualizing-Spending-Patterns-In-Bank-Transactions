import * as XLSX from 'xlsx';

export async function loadData() {
  const response = await fetch('/Open Bank Transaction Data.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[1];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return { jsonData, worksheet };
}
