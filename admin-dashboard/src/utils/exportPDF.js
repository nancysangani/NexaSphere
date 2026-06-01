import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(columns, data, filename) {
  const doc = new jsPDF();
  doc.text(filename, 14, 10);
  autoTable(doc, { head: [columns], body: data });
  doc.save(`${filename}.pdf`);
}
