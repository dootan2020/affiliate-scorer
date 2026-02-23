import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: unknown;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsvFile(file);
  }
  if (extension === "xlsx" || extension === "xls") {
    return parseExcelFile(file);
  }

  throw new Error(`Định dạng file không hỗ trợ: .${extension}. Chỉ hỗ trợ .csv, .xlsx, .xls`);
}

async function parseCsvFile(file: File): Promise<ParseResult> {
  const text = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data as ParsedRow[];
        resolve({ headers, rows });
      },
      error: (error: Error) => {
        reject(new Error(`Lỗi đọc file CSV: ${error.message}`));
      },
    });
  });
}

async function parseExcelFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("File Excel không có sheet nào");
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet) as ParsedRow[];
  const headers =
    jsonData.length > 0 ? Object.keys(jsonData[0] as Record<string, unknown>) : [];

  return { headers, rows: jsonData };
}
