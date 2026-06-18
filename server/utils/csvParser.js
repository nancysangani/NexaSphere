/**
 * Custom robust CSV Parser and Generator Utility
 */

export function parseCSV(csvText) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Double quotes escape a single quote
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push the final field and line if not terminated by newline
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headers = lines[0].map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '')
  );
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Skip empty lines
    if (row.length === 1 && row[0] === '') continue;

    const record = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      record[header] = row[j] !== undefined ? row[j].trim() : '';
    }
    records.push(record);
  }

  return records;
}

export function generateCSV(records, fields) {
  const headerRow = fields.join(',');
  const rows = records.map((record) => {
    return fields
      .map((field) => {
        const val = String(
          record[field] !== undefined && record[field] !== null ? record[field] : ''
        );
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',');
  });

  return [headerRow, ...rows].join('\n');
}
