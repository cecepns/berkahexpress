import { forwardRef } from 'react';
import Barcode from 'react-barcode';
import logo from '../assets/logo.png';

const ResiPrint = forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  return (
    <div ref={ref} className="print-container">
      <style>
        {`
          @media print {
            @page {
              size: A5;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-container {
              width: 100%;
              padding: 12px;
              font-family: Arial, sans-serif;
            }
          }
          @media screen {
            .print-container {
              display: none;
            }
          }
        `}
      </style>
      
      <div style={{ padding: '12px', fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '5px' }}>
            <img src={logo} alt="Berkah Express Logo" style={{ height: '45px', width: 'auto' }} />
            {/* <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>BERKAH EXPRESS</h1> */}
          </div>
          <p style={{ margin: '3px 0', fontSize: '10px' }}>Jasa Pengiriman Terpercaya</p>
        </div>

        {/* Barcode Section */}
        <div style={{ textAlign: 'center', marginBottom: '10px', padding: '8px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <Barcode 
              value={transaction.resi} 
              width={1.5}
              height={40}
              displayValue={true}
              fontSize={14}
              margin={5}
            />
          </div>
          <div style={{ fontSize: '10px', marginTop: '5px' }}>
            <strong>Tanggal:</strong> {new Date(transaction.created_at).toLocaleDateString('id-ID')} 
            {/* <strong> Status:</strong> {transaction.status.toUpperCase()} */}
          </div>
        </div>

        {/* Sender & Receiver Info in One Card */}
        <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '3px' }}>
          <div style={{ display: 'flex', gap: '15px', fontSize: '10px' }}>
            {/* Sender */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>
                PENGIRIM
              </div>
              <div style={{ lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold' }}>{transaction.user_name}</div>
                <div>{transaction.user_phone}</div>
              </div>
            </div>

            {/* Receiver */}
            <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>
                PENERIMA
              </div>
              <div style={{ lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold' }}>{transaction.receiver_name}</div>
                <div>{transaction.receiver_phone}</div>
                <div>{transaction.receiver_address}</div>
                <div style={{ fontWeight: 'bold', marginTop: '2px' }}>📍 {transaction.destination}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Info & Pricing in One Row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {/* Package Info */}
          <div style={{ flex: 1, border: '1px solid #ddd', padding: '8px', borderRadius: '3px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>
              INFORMASI PAKET
            </div>
            <div style={{ fontSize: '9px', lineHeight: '1.5' }}>
              <div><strong>Kategori:</strong> {transaction.item_category || 'NORMAL'}</div>
              <div><strong>Berat:</strong> {transaction.weight} kg</div>
              <div><strong>Dimensi:</strong> {transaction.length} x {transaction.width} x {transaction.height} cm</div>
              <div><strong>Volume:</strong> {transaction.volume ? Number(transaction.volume).toFixed(4) : '0.0000'} m³</div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ flex: 1, border: '2px solid #000', padding: '8px', borderRadius: '3px', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
              BIAYA PENGIRIMAN
            </div>
            <div style={{ fontSize: '9px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Harga/KG:</span>
                <span>Rp {transaction.price_per_kg ? Number(transaction.price_per_kg).toLocaleString('id-ID') : '0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Harga/Vol:</span>
                <span>Rp {transaction.price_per_volume ? Number(transaction.price_per_volume).toLocaleString('id-ID') : '0'}</span>
              </div>
              <div style={{ borderTop: '1px solid #000', marginTop: '5px', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                <span>TOTAL:</span>
                <span>Rp {transaction.total_price ? Number(transaction.total_price).toLocaleString('id-ID') : '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', fontSize: '8px', textAlign: 'center', color: '#666' }}>
          <div>Terima kasih telah menggunakan layanan Berkah Express | Dokumen ini sah tanpa tanda tangan</div>
          <div>Dicetak: {new Date().toLocaleString('id-ID')}</div>
        </div>
      </div>
    </div>
  );
});

ResiPrint.displayName = 'ResiPrint';

export default ResiPrint;

