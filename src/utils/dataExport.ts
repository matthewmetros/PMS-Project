import { QueryResult } from '../types/pms.types';

export const generateCSV = (data: Record<string, any>[]): string => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const generateExcelFormat = (data: Record<string, any>[]): string => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join('\t');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && (val.includes('\t') || val.includes('\n')) 
        ? `"${val.replace(/"/g, '""')}"` 
        : val
    ).join('\t')
  );
  
  return [headers, ...rows].join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSV = (queryResults: QueryResult | null) => {
  if (!queryResults || !queryResults.data) return;
  
  const csv = generateCSV(queryResults.data);
  downloadFile(csv, `export_${Date.now()}.csv`);
};

export const exportJSON = (queryResults: QueryResult | null) => {
  if (!queryResults || !queryResults.data) return;
  
  const json = JSON.stringify(queryResults.data, null, 2);
  downloadFile(json, `export_${Date.now()}.json`, 'application/json');
};