import Papa from 'papaparse';

export const parseJSON = async (file: File): Promise<any[]> => {
  const text = await file.text();
  const jsonData = JSON.parse(text);
  return Array.isArray(jsonData) ? jsonData : [jsonData];
};

export const flattenJSON = (data: any[]): any[] => {
  const flatten = (obj: any, prefix = ''): any =>
    Object.keys(obj).reduce((acc, key) => {
      const prop = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(acc, flatten(obj[key], prop));
      } else {
        acc[prop] = obj[key];
      }
      return acc;
    }, {} as Record<string, any>);

  return data.map((item) => flatten(item));
};

export const exportToJSON = (data: any[], includeOriginal: boolean, originalData?: any[]) => {
  const exportData = includeOriginal && originalData ? { originalData, annotations: data } : data;
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const parseCSV = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
};

export const exportToCSV = (data: any[]) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
  URL.revokeObjectURL(url);
};
