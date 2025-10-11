import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import Barcode from 'react-barcode';
import logo from '../assets/logo.png';

const ResiPrint = forwardRef(({ transaction, isCustomer = false }, ref) => {
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

        {/* ID Order & Resi Section */}
        <div style={{ textAlign: 'left', marginBottom: '10px', padding: '8px', backgroundColor: 'white' }}>
          <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>ID Order:</strong> #{transaction.id}
            </div>
            {!isCustomer && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                <strong>No. Resi:</strong> {transaction.resi}
              </div>
            )}
          </div>
        </div>

        {/* Sender & Receiver Info - Same layout for both admin and customer */}
        {/* Sender Card - Separate */}
        <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '3px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #ddd', paddingBottom: '3px', textAlign: 'left' }}>
            PENGIRIM
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.4', textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold' }}>{transaction.user_name}</div>
            <div>{transaction.user_phone}</div>
          </div>
        </div>

        {/* Receiver Card - Separate */}
        <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '3px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '11px', borderBottom: '1px solid #ddd', paddingBottom: '3px', textAlign: 'left' }}>
            PENERIMA
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.4', textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold' }}>{transaction.receiver_name}</div>
            <div>{transaction.receiver_phone}</div>
            <div>{transaction.receiver_address}</div>
            <div style={{ fontWeight: 'bold', marginTop: '2px' }}>📍 {transaction.destination}</div>
          </div>
        </div>

        {/* Package Info */}
        <div style={{ border: '1px solid #ddd', padding: '8px', marginBottom: '10px', borderRadius: '3px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px', borderBottom: '1px solid #ddd', paddingBottom: '3px', textAlign: 'left' }}>
            INFORMASI PAKET
          </div>
          <div style={{ fontSize: '9px', lineHeight: '1.5', textAlign: 'left' }}>
            <div><strong>Tanggal:</strong> {new Date(transaction.created_at).toLocaleDateString('id-ID')}</div>
            <div><strong>Kategori:</strong> {transaction.item_category || 'NORMAL'}</div>
            <div><strong>Berat:</strong> {transaction.weight} kg</div>
            <div><strong>Dimensi:</strong> {transaction.length} x {transaction.width} x {transaction.height} cm</div>
            <div><strong>Volume:</strong> {transaction.volume ? Number(transaction.volume).toFixed(4) : '0.0000'} m³</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', fontSize: '8px', textAlign: 'left', color: '#666' }}>
          <div>Terima kasih telah menggunakan layanan Berkah Express | Dokumen ini sah tanpa tanda tangan</div>
          <div>Dicetak: {new Date().toLocaleString('id-ID')}</div>
        </div>

        {/* Barcode Section - Only show at bottom for admin */}
        {!isCustomer && (
          <div style={{ marginTop: '15px', padding: '8px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'inline-block' }}>
              <Barcode 
                value={transaction.resi} 
                width={1.5}
                height={35}
                displayValue={true}
                fontSize={12}
                margin={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ResiPrint.displayName = 'ResiPrint';

ResiPrint.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.number,
    resi: PropTypes.string,
    created_at: PropTypes.string,
    user_name: PropTypes.string,
    user_phone: PropTypes.string,
    receiver_name: PropTypes.string,
    receiver_phone: PropTypes.string,
    receiver_address: PropTypes.string,
    destination: PropTypes.string,
    item_category: PropTypes.string,
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    length: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    volume: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price_per_kg: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price_per_volume: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isCustomer: PropTypes.bool,
};

export default ResiPrint;

