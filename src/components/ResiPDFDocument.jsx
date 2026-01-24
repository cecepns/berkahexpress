import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo from '../assets/logo.png';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
    borderBottom: '2pt solid #000',
    paddingBottom: 6,
  },
  logo: {
    width: 50,
    height: 'auto',
    marginBottom: 4,
    alignSelf: 'center',
  },
  tagline: {
    fontSize: 8,
    marginTop: 3,
  },
  resiSection: {
    marginBottom: 6,
    padding: 6,
  },
  resiText: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  resiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    border: '1pt solid #333',
    padding: 8,
    marginBottom: 6,
    borderRadius: 3,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 5,
    borderBottom: '1pt solid #333',
    paddingBottom: 3,
  },
  cardContent: {
    fontSize: 8,
    lineHeight: 1.5,
  },
  row: {
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    borderTop: '1pt solid #333',
    paddingTop: 8,
    fontSize: 7,
    color: '#666',
  },
  footerRow: {
    marginBottom: 2,
  },
  barcodeSection: {
    marginTop: 8,
    textAlign: 'center',
  },
  barcodeImage: {
    width: '50%',
    height: 'auto',
    maxHeight: 40,
    alignSelf: 'center',
  },
});

// Helper function to mask last 5 digits of phone number
const maskPhone = (phone) => {
  if (!phone || phone === '-') return '-';
  const str = String(phone);
  if (str.length <= 5) return str;
  return str.slice(0, -5) + '***';
};

const ResiPDFDocument = ({ transaction, isCustomer = false, barcodeBase64 = null }) => {
  if (!transaction) return null;

  // Check if user is mitra and has ekspedisi_name
  const isMitra = transaction.user_role === 'mitra';
  const expeditionName = transaction.ekspedisi_name;

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {isMitra && expeditionName ? (
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{expeditionName}</Text>
          ) : !isMitra ? (
            <>
              <Image src={logo} style={styles.logo} />
              <Text style={styles.tagline}>Jasa Pengiriman Terpercaya</Text>
            </>
          ) : null}
        </View>

        {/* Resi Section */}
        <View style={styles.resiSection}>
          {isCustomer ? (
            <Text style={styles.resiText}>ID Order: {transaction.resi}</Text>
          ) : (
            <View style={styles.resiRow}>
              <Text style={styles.resiText}>ID Order: {transaction.resi}</Text>
              {transaction.expedition_resi && (
                <Text style={styles.resiText}>No. Resi: {transaction.expedition_resi}</Text>
              )}
            </View>
          )}
        </View>

        {/* Sender Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PENGIRIM</Text>
          <View style={styles.cardContent}>
            <Text style={[styles.row, styles.bold]}>{transaction.sender_name || transaction.user_name || '-'}</Text>
            <Text style={styles.row}>{maskPhone(transaction.sender_phone || transaction.user_phone)}</Text>
            <Text style={styles.row}>{transaction.sender_address || transaction.user_address || '-'}</Text>
          </View>
        </View>

        {/* Receiver Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PENERIMA</Text>
          <View style={styles.cardContent}>
            <Text style={[styles.row, styles.bold]}>{transaction.receiver_name || '-'}</Text>
            <Text style={styles.row}>{maskPhone(transaction.receiver_phone)}</Text>
            <Text style={styles.row}>{transaction.receiver_address || '-'}</Text>
            <Text style={[styles.row, styles.bold]}>{transaction.destination || '-'}</Text>
          </View>
        </View>

        {/* Package Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>INFORMASI PAKET</Text>
          <View style={styles.cardContent}>
            <Text style={styles.row}>
              Tanggal: {new Date(transaction.created_at).toLocaleDateString('id-ID')}
            </Text>
            <Text style={styles.row}>Kategori: {transaction.item_category || 'Reguler'}</Text>
            <Text style={styles.row}>Berat: {transaction.weight} kg</Text>
            <Text style={styles.row}>
              Dimensi: {transaction.length} x {transaction.width} x {transaction.height} cm
            </Text>
            <Text style={styles.row}>
              Volume Weight: {transaction.volume ? Number(transaction.volume).toFixed(2) : '0.00'} kg
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerRow}>
            {isMitra && expeditionName ? `Terima kasih telah menggunakan layanan ${expeditionName}` : 'Terima kasih telah menggunakan layanan Berkah Express'}
          </Text>
          <Text style={styles.footerRow}>
            Dokumen ini sah tanpa tanda tangan
          </Text>
          <Text style={styles.footerRow}>
            Dicetak: {new Date().toLocaleString('id-ID')}
          </Text>
        </View>

        {/* Barcode Section - Only for admin */}
        {barcodeBase64 && (
          <View style={styles.barcodeSection}>
            <Image src={barcodeBase64} style={styles.barcodeImage} />
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResiPDFDocument;

