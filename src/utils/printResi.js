import { createElement } from 'react';
import logo from '../assets/logo.png';
import { pdf } from '@react-pdf/renderer';
import ResiPDFDocument from '../components/ResiPDFDocument';

/**
 * Generate HTML content for resi print
 */
export const generateResiHTML = (transaction, isCustomer = false) => {
  if (!transaction) return '';

  const barcodeDataURL = transaction.expedition_resi 
    ? `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(transaction.expedition_resi)}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resi - ${transaction.resi}</title>
  <style>
    @page {
      size: A5;
      margin: 8mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 12px;
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 5px;
    }
    
    .logo {
      height: 45px;
      width: auto;
    }
    
    .tagline {
      margin: 3px 0;
      font-size: 10px;
    }
    
    .resi-section {
      text-align: left;
      margin-bottom: 10px;
      padding: 8px;
      background-color: white;
    }
    
    .resi-info {
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .resi-label {
      font-family: monospace;
      font-size: 11px;
    }
    
    .card {
      border: 1px solid #ddd;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 3px;
    }
    
    .card-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 11px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 3px;
      text-align: left;
    }
    
    .card-content {
      font-size: 10px;
      line-height: 1.4;
      text-align: left;
    }
    
    .card-content div {
      margin-bottom: 2px;
    }
    
    .footer {
      border-top: 1px solid #ddd;
      padding-top: 8px;
      font-size: 8px;
      text-align: left;
      color: #666;
    }
    
    .barcode-section {
      margin-top: 15px;
      padding: 8px;
      background-color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .barcode-img {
      max-width: 100%;
      height: auto;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <img src="${logo}" alt="Berkah Express Logo" class="logo" />
      </div>
      <p class="tagline">Jasa Pengiriman Terpercaya</p>
    </div>

    <!-- Resi Section -->
    <div class="resi-section">
      <div class="resi-info">
        ${isCustomer ? `
          <div class="resi-label">
            <strong>ID Order:</strong> ${transaction.resi}
          </div>
        ` : `
          <div class="resi-label">
            <strong>ID Order:</strong> ${transaction.resi}
          </div>
          ${transaction.expedition_resi ? `
            <div class="resi-label">
              <strong>No. Resi:</strong> ${transaction.expedition_resi}
            </div>
          ` : ''}
        `}
      </div>
    </div>

    <!-- Sender Card -->
    <div class="card">
      <div class="card-title">PENGIRIM</div>
      <div class="card-content">
        <div style="font-weight: bold;">${transaction.user_name || '-'}</div>
        <div>${transaction.user_phone || '-'}</div>
      </div>
    </div>

    <!-- Receiver Card -->
    <div class="card">
      <div class="card-title">PENERIMA</div>
      <div class="card-content">
        <div style="font-weight: bold;">${transaction.receiver_name || '-'}</div>
        <div>${transaction.receiver_phone || '-'}</div>
        <div>${transaction.receiver_address || '-'}</div>
        <div style="font-weight: bold; margin-top: 2px;">${transaction.destination || '-'}</div>
      </div>
    </div>

    <!-- Package Info -->
    <div class="card">
      <div class="card-title">INFORMASI PAKET</div>
      <div class="card-content">
        <div><strong>Tanggal:</strong> ${new Date(transaction.created_at).toLocaleDateString('id-ID')}</div>
        <div><strong>Kategori:</strong> ${transaction.item_category || 'NORMAL'}</div>
        <div><strong>Berat:</strong> ${transaction.weight} kg</div>
        <div><strong>Dimensi:</strong> ${transaction.length} x ${transaction.width} x ${transaction.height} cm</div>
        <div><strong>Volume Weight:</strong> ${transaction.volume ? Number(transaction.volume).toFixed(2) : '0.00'} kg</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Terima kasih telah menggunakan layanan Berkah Express | Dokumen ini sah tanpa tanda tangan</div>
      <div>Dicetak: ${new Date().toLocaleString('id-ID')}</div>
    </div>

    ${!isCustomer && transaction.expedition_resi ? `
      <!-- Barcode Section -->
      <div class="barcode-section">
        <img src="${barcodeDataURL}" alt="Barcode" class="barcode-img" />
      </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
};

/**
 * Open print window with resi content
 */
export const printResiInNewWindow = (transaction, isCustomer = false) => {
  if (!transaction) {
    console.error('No transaction data provided');
    return;
  }

  const html = generateResiHTML(transaction, isCustomer);
  
  // Open new window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Mohon izinkan popup untuk mencetak resi');
    return;
  }

  // Write HTML content
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load (especially images)
  printWindow.onload = () => {
    // Small delay to ensure everything is rendered
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      
      // Close window after print dialog is closed (optional)
      // Some browsers might not support this
      printWindow.onafterprint = () => {
        setTimeout(() => {
          printWindow.close();
        }, 100);
      };
    }, 250);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    if (printWindow && !printWindow.closed) {
      printWindow.focus();
      printWindow.print();
    }
  }, 500);
};

/**
 * Fetch image and convert to base64
 */
const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

/**
 * Download resi as PDF using @react-pdf/renderer
 */
export const downloadResiAsPDF = async (transaction, isCustomer = false) => {
  if (!transaction) {
    console.error('No transaction data provided');
    return;
  }

  try {
    console.log('Starting PDF generation for transaction:', transaction.resi);

    // Fetch barcode as base64 if needed
    let barcodeBase64 = null;
    if (!isCustomer && transaction.expedition_resi) {
      console.log('Fetching barcode for expedition_resi:', transaction.expedition_resi);
      const barcodeURL = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(transaction.expedition_resi)}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`;
      barcodeBase64 = await fetchImageAsBase64(barcodeURL);
      console.log('Barcode fetched:', barcodeBase64 ? 'success' : 'failed');
    }

    // Generate PDF blob using @react-pdf/renderer
    const blob = await pdf(
      createElement(ResiPDFDocument, { transaction, isCustomer, barcodeBase64 })
    ).toBlob();

    console.log('PDF blob created, size:', blob.size, 'bytes');

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resi-${transaction.resi}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('PDF downloaded successfully');
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

