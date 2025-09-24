import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Format date for filenames
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
const getFormattedDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Sanitize filename by removing special characters
 * @param {string} filename - The original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9\-]/gi, '_').toLowerCase();
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} [filename='data'] - Base filename (without extension)
 * @returns {void}
 */
export const exportToExcel = (data, filename = 'data') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${sanitizeFilename(filename)}_${getFormattedDate()}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {Array} [columns] - Column definitions with header and key
 * @param {string} [title='Report'] - Title for the PDF document
 * @param {string} [filename='report'] - Base filename (without extension)
 * @returns {void}
 */
export const exportToPDF = (data, columns, title = 'Report', filename = 'report') => {
  if (!data || data.length === 0) {
    throw new Error('No data available for export');
  }
  
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare table data
    const headers = columns ? columns.map(col => col.header) : Object.keys(data[0]);
    const tableData = data.map(item => 
      columns 
        ? columns.map(col => item[col.key] || '')
        : Object.values(item)
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      margin: { top: 35 },
      didDrawPage: function(data) {
        // Add page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Save the PDF
    doc.save(`${sanitizeFilename(filename)}_${getFormattedDate()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @param {string} [currency='LKR'] - Currency code
 * @returns {string} Formatted currency string
 */
/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} [filename='data'] - Base filename (without extension)
 * @returns {void}
 */
export const exportToCSV = (data, filename = 'data') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data available for export');
    }

    // Get headers from the first object's keys
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\r\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Escape quotes and wrap in quotes if needed
        const value = item[header] !== null && item[header] !== undefined 
          ? String(item[header]).replace(/"/g, '"')
          : '';
        return `"${value}"`;
      });
      csvContent += row.join(',') + '\r\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${sanitizeFilename(filename)}_${getFormattedDate()}.csv`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @param {string} [currency='LKR'] - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'LKR') => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default {
  exportToExcel,
  exportToPDF,
  exportToCSV,
  formatCurrency
};
