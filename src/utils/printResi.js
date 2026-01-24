import { createElement } from 'react';
import logo from '../assets/logo.png';
import { pdf } from '@react-pdf/renderer';
import ResiPDFDocument from '../components/ResiPDFDocument';
import JsBarcode from 'jsbarcode';

// Helper function to mask last 5 digits of phone number
const maskPhone = (phone) => {
  if (!phone || phone === '-') return '-';
  const str = String(phone);
  if (str.length <= 5) return str;
  return str.slice(0, -5) + '***';
};

/**
 * Generate HTML content for resi print
 */
export const generateResiHTML = (transaction, isCustomer = false) => {
  if (!transaction) return '';

  // Check if user is mitra and has ekspedisi_name
  const isMitra = transaction.user_role === 'mitra';
  const expeditionName = transaction.ekspedisi_name;

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
      ${isMitra && expeditionName ? `
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${expeditionName}</h1>
      ` : !isMitra ? `
        <div class="header-content">
          <img src="${logo}" alt="Berkah Express Logo" class="logo" />
        </div>
        <p class="tagline">Jasa Pengiriman Terpercaya</p>
      ` : ''}
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
        <div style="font-weight: bold;">${transaction.sender_name || transaction.user_name || '-'}</div>
        <div>${maskPhone(transaction.sender_phone || transaction.user_phone)}</div>
        <div>${transaction.sender_address || transaction.user_address || '-'}</div>
      </div>
    </div>

    <!-- Receiver Card -->
    <div class="card">
      <div class="card-title">PENERIMA</div>
      <div class="card-content">
        <div style="font-weight: bold;">${transaction.receiver_name || '-'}</div>
        <div>${maskPhone(transaction.receiver_phone)}</div>
        <div>${transaction.receiver_address || '-'}</div>
        <div style="font-weight: bold; margin-top: 2px;">${transaction.destination || '-'}</div>
      </div>
    </div>

    <!-- Package Info -->
    <div class="card">
      <div class="card-title">INFORMASI PAKET</div>
      <div class="card-content">
        <div><strong>Tanggal:</strong> ${new Date(transaction.created_at).toLocaleDateString('id-ID')}</div>
        <div><strong>Kategori:</strong> ${transaction.item_category || 'Reguler'}</div>
        <div><strong>Berat:</strong> ${transaction.weight} kg</div>
        <div><strong>Dimensi:</strong> ${transaction.length} x ${transaction.width} x ${transaction.height} cm</div>
        <div><strong>Volume Weight:</strong> ${transaction.volume ? Number(transaction.volume).toFixed(2) : '0.00'} kg</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Terima kasih telah menggunakan layanan ${isMitra && expeditionName ? expeditionName : 'Berkah Express'} | Dokumen ini sah tanpa tanda tangan</div>
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
 * Generate barcode as base64 using jsbarcode
 */
const generateBarcodeBase64 = (text) => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    
    // Generate barcode on canvas
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    });
    
    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/png');
    console.log('Barcode generated successfully, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Error generating barcode:', error);
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

    // Generate barcode as base64 if needed
    let barcodeBase64 = null;
    if (!isCustomer && transaction.expedition_resi) {
      console.log('Generating barcode for expedition_resi:', transaction.expedition_resi);
      barcodeBase64 = generateBarcodeBase64(transaction.expedition_resi);
      console.log('Barcode generated:', barcodeBase64 ? 'success' : 'failed');
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

