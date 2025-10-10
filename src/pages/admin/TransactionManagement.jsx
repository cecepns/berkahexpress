import { useState, useEffect, useRef } from 'react';
import { transactionAPI, expeditionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import { 
  EyeIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  PrinterIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import ResiPrint from '../../components/ResiPrint';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [expeditionForm, setExpeditionForm] = useState({
    expedition_id: '',
    expedition_resi: ''
  });

  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Resi-${selectedTransaction?.resi || 'BerkahExpress'}`,
    onAfterPrint: () => toast.success('Resi berhasil dicetak!'),
  });

  useEffect(() => {
    fetchTransactions();
    fetchExpeditions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getAllTransactions();
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpeditions = async () => {
    try {
      const response = await expeditionAPI.getAllExpeditions();
      setExpeditions(response.data.data);
    } catch (error) {
      console.error('Error fetching expeditions:', error);
    }
  };

  const handleStatusUpdate = async (transactionId, status) => {
    try {
      await transactionAPI.updateTransactionStatus(transactionId, status);
      toast.success('Status transaksi berhasil diupdate');
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  };

  const handleCancelOrder = async (transaction) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan pesanan dengan resi ${transaction.resi}? Saldo akan dikembalikan ke customer.`)) {
      return;
    }

    try {
      await transactionAPI.cancelTransaction(transaction.id);
      toast.success(`Pesanan berhasil dibatalkan. Saldo Rp ${Number(transaction.total_price).toLocaleString('id-ID')} telah dikembalikan.`);
      fetchTransactions();
    } catch (error) {
      console.error('Error canceling transaction:', error);
    }
  };

  const handleExpeditionUpdate = async (e) => {
    e.preventDefault();
    if (!expeditionForm.expedition_id || !expeditionForm.expedition_resi) {
      toast.error('Pilih ekspedisi dan masukkan no resi');
      return;
    }

    try {
      await transactionAPI.updateTransactionExpedition(selectedTransaction.id, expeditionForm);
      toast.success('Ekspedisi berhasil diupdate dan status otomatis berubah ke Dikirim');
      setShowModal(false);
      setExpeditionForm({ expedition_id: '', expedition_resi: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Error updating expedition:', error);
    }
  };

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    // Pre-populate form if expedition info exists
    if (transaction.expedition_id && transaction.expedition_resi) {
      setExpeditionForm({
        expedition_id: transaction.expedition_id.toString(),
        expedition_resi: transaction.expedition_resi
      });
    } else {
      setExpeditionForm({ expedition_id: '', expedition_resi: '' });
    }
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'dikirim':
        return 'text-blue-600 bg-blue-100';
      case 'sukses':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.resi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Transaksi</h1>
        <p className="mt-2 text-gray-600">Kelola semua transaksi pengiriman</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari resi, user, atau tujuan..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="dikirim">Dikirim</option>
            <option value="sukses">Sukses</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resi Ekspedisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengirim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tujuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Berat/Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono">{transaction.resi}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.expedition_resi ? (
                      <div className="text-sm font-medium text-blue-600 font-mono">{transaction.expedition_resi}</div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Belum diinput</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.user_name}</div>
                      <div className="text-sm text-gray-500">{transaction.user_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.destination}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.weight} kg
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.volume ? Number(transaction.volume).toFixed(4) : '0.0000'} m³
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Rp {transaction.total_price ? Number(transaction.total_price).toLocaleString('id-ID') : '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(transaction)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setTimeout(() => handlePrint(), 100);
                      }}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Cetak Resi"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </button>
                    {transaction.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(transaction)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Batalkan Pesanan"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada transaksi yang ditemukan' : 'Belum ada transaksi'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white my-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Detail Transaksi
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resi Kami</label>
                  <p className="mt-1 text-sm font-mono font-semibold text-gray-900">{selectedTransaction.resi}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori Barang</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.item_category || 'NORMAL'}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Informasi Pengirim</h4>
                  <p className="text-sm text-gray-900">{selectedTransaction.user_name}</p>
                  <p className="text-sm text-gray-500">{selectedTransaction.user_email}</p>
                  <p className="text-sm text-gray-500">{selectedTransaction.user_phone}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Informasi Penerima</h4>
                  <p className="text-sm text-gray-900">Negara: {selectedTransaction.destination}</p>
                  {selectedTransaction.receiver_name && (
                    <p className="text-sm font-medium text-gray-900 mt-2">Nama: {selectedTransaction.receiver_name}</p>
                  )}
                  {selectedTransaction.receiver_phone && (
                    <p className="text-sm text-gray-500">Telp: {selectedTransaction.receiver_phone}</p>
                  )}
                  {selectedTransaction.receiver_address && (
                    <p className="text-sm text-gray-500">Alamat: {selectedTransaction.receiver_address}</p>
                  )}
                  {selectedTransaction.email_penerima && (
                    <p className="text-sm text-gray-500">Email: {selectedTransaction.email_penerima}</p>
                  )}
                  {selectedTransaction.kode_pos_penerima && (
                    <p className="text-sm text-gray-500">Kode Pos: {selectedTransaction.kode_pos_penerima}</p>
                  )}
                  {selectedTransaction.nomor_identitas_penerima && (
                    <p className="text-sm text-gray-500">No. Identitas: {selectedTransaction.nomor_identitas_penerima}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Dimensi & Berat</h4>
                  <p className="text-sm text-gray-900">Berat: {selectedTransaction.weight} kg</p>
                  <p className="text-sm text-gray-900">
                    Dimensi: {selectedTransaction.length} x {selectedTransaction.width} x {selectedTransaction.height} cm
                  </p>
                  <p className="text-sm text-gray-500">Volume: {selectedTransaction.volume ? Number(selectedTransaction.volume).toFixed(4) : '0.0000'} m³</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Biaya</h4>
                  <p className="text-sm text-gray-500">Harga per KG: Rp {selectedTransaction.price_per_kg ? Number(selectedTransaction.price_per_kg).toLocaleString('id-ID') : '0'}</p>
                  <p className="text-sm text-gray-500">Harga per Vol: Rp {selectedTransaction.price_per_volume ? Number(selectedTransaction.price_per_volume).toLocaleString('id-ID') : '0'}</p>
                  <p className="mt-2 text-lg font-semibold text-primary-600">
                    Total: Rp {selectedTransaction.total_price ? Number(selectedTransaction.total_price).toLocaleString('id-ID') : '0'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Transaksi</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Expedition Form - Always allow editing */}
                <div className="border-l pl-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedTransaction.expedition_resi ? 'Edit Ekspedisi' : 'Input Ekspedisi'}
                  </h4>
                  <form onSubmit={handleExpeditionUpdate} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pilih Ekspedisi</label>
                      <select
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={expeditionForm.expedition_id}
                        onChange={(e) => setExpeditionForm({...expeditionForm, expedition_id: e.target.value})}
                        required
                      >
                        <option value="">Pilih Ekspedisi</option>
                        {expeditions.map(exp => (
                          <option key={exp.id} value={exp.id}>{exp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">No. Resi Ekspedisi</label>
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={expeditionForm.expedition_resi}
                        onChange={(e) => setExpeditionForm({...expeditionForm, expedition_resi: e.target.value})}
                        placeholder="Masukkan no resi ekspedisi"
                        required
                      />
                    </div>
                    {selectedTransaction.status === 'pending' && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-xs text-blue-600">
                          <strong>Info:</strong> Setelah input resi ekspedisi, status otomatis akan berubah menjadi &ldquo;Dikirim&rdquo;
                        </p>
                      </div>
                    )}
                    {selectedTransaction.expedition_resi && (
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-xs text-yellow-700">
                          <strong>Resi Saat Ini:</strong> <span className="font-mono">{selectedTransaction.expedition_resi}</span>
                        </p>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                    >
                      {selectedTransaction.expedition_resi ? 'Update Ekspedisi' : 'Simpan Ekspedisi'}
                    </button>
                  </form>
                </div>

                {/* Identity Documents */}
                {(selectedTransaction.foto_alamat || selectedTransaction.tanda_pengenal_depan || selectedTransaction.tanda_pengenal_belakang) && (
                  <div className="border-l pl-6 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Dokumen Identitas</h4>
                    <div className="space-y-2">
                      {selectedTransaction.foto_alamat && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Foto Alamat</label>
                          <a 
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads-berkahexpress/${selectedTransaction.foto_alamat}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Lihat Dokumen
                          </a>
                        </div>
                      )}
                      {selectedTransaction.tanda_pengenal_depan && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Tanda Pengenal Depan</label>
                          <a 
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads-berkahexpress/${selectedTransaction.tanda_pengenal_depan}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Lihat Dokumen
                          </a>
                        </div>
                      )}
                      {selectedTransaction.tanda_pengenal_belakang && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Tanda Pengenal Belakang</label>
                          <a 
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads-berkahexpress/${selectedTransaction.tanda_pengenal_belakang}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Lihat Dokumen
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Status Update */}
                {selectedTransaction.status === 'dikirim' && (
                  <div className="border-l pl-6 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedTransaction.id, 'sukses');
                        setShowModal(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Tandai Sukses
                    </button>
                  </div>
                )}

                {/* Cancel Order Button */}
                {selectedTransaction.status === 'pending' && (
                  <div className="border-l pl-6 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batalkan Pesanan</label>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        handleCancelOrder(selectedTransaction);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Batalkan Pesanan
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      Saldo customer sebesar Rp {selectedTransaction.total_price ? Number(selectedTransaction.total_price).toLocaleString('id-ID') : '0'} akan dikembalikan
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                Cetak Resi
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTransaction(null);
                  setExpeditionForm({ expedition_id: '', expedition_resi: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <ResiPrint ref={printRef} transaction={selectedTransaction} />
      </div>
    </div>
  );
};

export default TransactionManagement;