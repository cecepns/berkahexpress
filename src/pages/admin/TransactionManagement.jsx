import { useState, useEffect } from 'react';
import { transactionAPI, expeditionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { printResiInNewWindow, downloadResiAsPDF } from '../../utils/printResi';
import { 
  EyeIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  PrinterIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expeditionForm, setExpeditionForm] = useState({
    expedition_id: '',
    expedition_resi: '',
    is_manual_tracking: false
  });
  const [editForm, setEditForm] = useState({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    destination: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    item_category: 'REGULER',
    weight: '',
    length: '',
    width: '',
    height: '',
    isi_paket: '',
    kode_pos_penerima: '',
    nomor_identitas_penerima: '',
    email_penerima: '',
  });
  const [editFiles, setEditFiles] = useState({
    foto_alamat: null,
    tanda_pengenal_depan: null,
    tanda_pengenal_belakang: null,
  });

  const handlePrint = (transaction) => {
    if (!transaction) {
      toast.error('Data transaksi tidak tersedia');
      return;
    }
    printResiInNewWindow(transaction, false);
  };

  const handleDownloadPDF = async (transaction) => {
    if (!transaction) {
      toast.error('Data transaksi tidak tersedia');
      return;
    }
    try {
      toast.info('Generating PDF...');
      await downloadResiAsPDF(transaction, false);
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchExpeditions();
  }, [currentPage, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAllTransactions(currentPage, 10);
      setTransactions(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
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
      toast.success(`Pesanan berhasil dibatalkan. Saldo Rp${Number(transaction.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} telah dikembalikan.`);
      fetchTransactions();
    } catch (error) {
      console.error('Error canceling transaction:', error);
    }
  };

  const handleExpeditionUpdate = async (e) => {
    e.preventDefault();
    
    // If manual tracking, don't require expedition_id
    if (!expeditionForm.is_manual_tracking && !expeditionForm.expedition_id) {
      toast.error('Pilih ekspedisi atau aktifkan tracking manual');
      return;
    }
    
    if (!expeditionForm.expedition_resi) {
      toast.error('Masukkan no resi');
      return;
    }

    try {
      const updateData = {
        expedition_id: expeditionForm.is_manual_tracking ? null : expeditionForm.expedition_id,
        expedition_resi: expeditionForm.expedition_resi,
        is_manual_tracking: expeditionForm.is_manual_tracking
      };
      
      await transactionAPI.updateTransactionExpedition(selectedTransaction.id, updateData);
      toast.success(expeditionForm.is_manual_tracking 
        ? 'Tracking manual berhasil diaktifkan dan status otomatis berubah ke Dikirim' 
        : 'Ekspedisi berhasil diupdate dan status otomatis berubah ke Dikirim');
      setShowModal(false);
      setExpeditionForm({ expedition_id: '', expedition_resi: '', is_manual_tracking: false });
      fetchTransactions();
    } catch (error) {
      console.error('Error updating expedition:', error);
    }
  };

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    // Pre-populate form if expedition info exists
    if (transaction.expedition_resi) {
      // Check if it's manual tracking (has resi but no expedition_id)
      const isManual = !transaction.expedition_id && transaction.expedition_resi;
      setExpeditionForm({
        expedition_id: transaction.expedition_id ? transaction.expedition_id.toString() : '',
        expedition_resi: transaction.expedition_resi,
        is_manual_tracking: isManual || transaction.is_manual_tracking || false
      });
    } else {
      setExpeditionForm({ expedition_id: '', expedition_resi: '', is_manual_tracking: false });
    }
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      sender_name: transaction.sender_name || transaction.user_name || '',
      sender_phone: transaction.sender_phone || transaction.user_phone || '',
      sender_address: transaction.sender_address || transaction.user_address || '',
      destination: transaction.destination || '',
      receiver_name: transaction.receiver_name || '',
      receiver_phone: transaction.receiver_phone || '',
      receiver_address: transaction.receiver_address || '',
      item_category: transaction.item_category || 'REGULER',
      weight: transaction.weight ? String(transaction.weight) : '',
      length: transaction.length ? String(transaction.length) : '',
      width: transaction.width ? String(transaction.width) : '',
      height: transaction.height ? String(transaction.height) : '',
      isi_paket: transaction.isi_paket || '',
      kode_pos_penerima: transaction.kode_pos_penerima || '',
      nomor_identitas_penerima: transaction.nomor_identitas_penerima || '',
      email_penerima: transaction.email_penerima || '',
    });
    setEditFiles({
      foto_alamat: null,
      tanda_pengenal_depan: null,
      tanda_pengenal_belakang: null,
    });
    setShowEditModal(true);
  };

  const handleEditFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setEditFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const formData = new FormData();
    formData.append('sender_name', editForm.sender_name);
    formData.append('sender_phone', editForm.sender_phone);
    formData.append('sender_address', editForm.sender_address);
    formData.append('destination', editForm.destination);
    formData.append('receiver_name', editForm.receiver_name);
    formData.append('receiver_phone', editForm.receiver_phone);
    formData.append('receiver_address', editForm.receiver_address);
    formData.append('item_category', editForm.item_category);
    formData.append('weight', Number(editForm.weight));
    formData.append('length', Number(editForm.length));
    formData.append('width', Number(editForm.width));
    formData.append('height', Number(editForm.height));
    formData.append('isi_paket', editForm.isi_paket);
    
    if (editForm.kode_pos_penerima) formData.append('kode_pos_penerima', editForm.kode_pos_penerima);
    if (editForm.nomor_identitas_penerima) formData.append('nomor_identitas_penerima', editForm.nomor_identitas_penerima);
    if (editForm.email_penerima) formData.append('email_penerima', editForm.email_penerima);
    
    if (editFiles.foto_alamat) formData.append('foto_alamat', editFiles.foto_alamat);
    if (editFiles.tanda_pengenal_depan) formData.append('tanda_pengenal_depan', editFiles.tanda_pengenal_depan);
    if (editFiles.tanda_pengenal_belakang) formData.append('tanda_pengenal_belakang', editFiles.tanda_pengenal_belakang);

    try {
      await transactionAPI.updateTransaction(selectedTransaction.id, formData);
      toast.success('Transaksi berhasil diupdate');
      setShowEditModal(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'dikirim':
        return 'text-blue-600 bg-blue-100';
      case 'bea_cukai':
        return 'text-orange-600 bg-orange-100';
      case 'in_transit':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivery_progress':
        return 'text-cyan-600 bg-cyan-100';
      case 'delivery_completed':
        return 'text-green-600 bg-green-100';
      case 'delivery_failed':
        return 'text-red-600 bg-red-100';
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
    <>
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
            <option value="bea_cukai">Bea Cukai</option>
            <option value="in_transit">In Transit</option>
            <option value="delivery_progress">Delivery Progress</option>
            <option value="delivery_completed">Delivery Completed</option>
            <option value="delivery_failed">Delivery Failed</option>
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
                      {transaction.volume ? Number(transaction.volume).toFixed(2) : '0.00'} kg (vol)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Rp{transaction.total_price ? Number(transaction.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
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
                      onClick={() => openEditModal(transaction)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit Transaksi"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {/* <button
                      onClick={() => handlePrint(transaction)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Cetak Resi"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </button> */}
                    <button
                      onClick={() => handleDownloadPDF(transaction)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

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
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.item_category || 'REGULER'}</p>
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Detail Paket</h4>
                  {selectedTransaction.isi_paket && (
                    <p className="text-sm text-gray-900 mb-2"><strong>Isi Paket:</strong> {selectedTransaction.isi_paket}</p>
                  )}
                  <p className="text-sm text-gray-900">Berat: {selectedTransaction.weight} kg</p>
                  <p className="text-sm text-gray-900">
                    Dimensi: {selectedTransaction.length} x {selectedTransaction.width} x {selectedTransaction.height} cm
                  </p>
                  <p className="text-sm text-gray-500">Volume Weight: {selectedTransaction.volume ? Number(selectedTransaction.volume).toFixed(2) : '0.00'} kg</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Biaya</h4>
                  <p className="text-sm text-gray-500">Harga per KG: Rp{selectedTransaction.price_per_kg ? Number(selectedTransaction.price_per_kg).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}</p>
                  <p className="text-sm text-gray-500">Harga per Vol: Rp{selectedTransaction.price_per_volume ? Number(selectedTransaction.price_per_volume).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}</p>
                  <p className="mt-2 text-lg font-semibold text-primary-600">
                    Total: Rp{selectedTransaction.total_price ? Number(selectedTransaction.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
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
                    {/* Manual Tracking Toggle */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <input
                        type="checkbox"
                        id="is_manual_tracking"
                        checked={expeditionForm.is_manual_tracking}
                        onChange={(e) => setExpeditionForm({
                          ...expeditionForm, 
                          is_manual_tracking: e.target.checked,
                          expedition_id: e.target.checked ? '' : expeditionForm.expedition_id
                        })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_manual_tracking" className="text-sm font-medium text-gray-700">
                        Tracking Manual
                      </label>
                    </div>
                      <span className="text-xs text-gray-500">(Input tracking secara manual oleh admin)</span>
                    
                    {expeditionForm.is_manual_tracking && (
                      <div className="bg-orange-50 p-3 rounded-md">
                        <p className="text-xs text-orange-700">
                          <strong>Info:</strong> Dengan tracking manual, status perjalanan paket akan diinput secara manual oleh admin melalui menu Tracking, tanpa menggunakan API ekspedisi eksternal.
                        </p>
                      </div>
                    )}
                    
                    {!expeditionForm.is_manual_tracking && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Ekspedisi</label>
                        <select
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          value={expeditionForm.expedition_id}
                          onChange={(e) => setExpeditionForm({...expeditionForm, expedition_id: e.target.value})}
                          required={!expeditionForm.is_manual_tracking}
                        >
                          <option value="">Pilih Ekspedisi</option>
                          {expeditions.map(exp => (
                            <option key={exp.id} value={exp.id}>{exp.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {expeditionForm.is_manual_tracking ? 'No. Resi / Kode Tracking' : 'No. Resi Ekspedisi'}
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={expeditionForm.expedition_resi}
                        onChange={(e) => setExpeditionForm({...expeditionForm, expedition_resi: e.target.value})}
                        placeholder={expeditionForm.is_manual_tracking ? "Masukkan kode tracking/resi" : "Masukkan no resi ekspedisi"}
                        required
                      />
                    </div>
                    {selectedTransaction.status === 'pending' && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-xs text-blue-600">
                          <strong>Info:</strong> Setelah input resi, status otomatis akan berubah menjadi &ldquo;Dikirim&rdquo;
                        </p>
                      </div>
                    )}
                    {selectedTransaction.expedition_resi && (
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-xs text-yellow-700">
                          <strong>Resi Saat Ini:</strong> <span className="font-mono">{selectedTransaction.expedition_resi}</span>
                          {selectedTransaction.is_manual_tracking && (
                            <span className="ml-2 text-orange-600">(Manual)</span>
                          )}
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
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads/${selectedTransaction.foto_alamat}`} 
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
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads/${selectedTransaction.tanda_pengenal_depan}`} 
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
                            href={`https://api-inventory.isavralabel.com/berkahexpress/uploads/${selectedTransaction.tanda_pengenal_belakang}`} 
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
                      Saldo customer sebesar Rp{selectedTransaction.total_price ? Number(selectedTransaction.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'} akan dikembalikan
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePrint(selectedTransaction)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-2"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Cetak Resi
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedTransaction)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download PDF
                </button>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTransaction(null);
                  setExpeditionForm({ expedition_id: '', expedition_resi: '', is_manual_tracking: false });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white my-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Edit Transaksi
            </h3>
            
            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              {/* Sender Information */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Informasi Pengirim</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Pengirim *</label>
                    <input
                      type="text"
                      name="sender_name"
                      value={editForm.sender_name}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telepon Pengirim *</label>
                    <input
                      type="tel"
                      name="sender_phone"
                      value={editForm.sender_phone}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Alamat Pengirim *</label>
                  <textarea
                    name="sender_address"
                    value={editForm.sender_address}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                    required
                  />
                </div>
              </div>

              {/* Receiver Information */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Informasi Penerima</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tujuan *</label>
                    <input
                      type="text"
                      name="destination"
                      value={editForm.destination}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Penerima *</label>
                    <input
                      type="text"
                      name="receiver_name"
                      value={editForm.receiver_name}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telepon Penerima *</label>
                    <input
                      type="tel"
                      name="receiver_phone"
                      value={editForm.receiver_phone}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori *</label>
                    <select
                      name="item_category"
                      value={editForm.item_category}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="REGULER">Normal</option>
                      <option value="SENSITIF">Sensitif</option>
                      <option value="BATERAI">Baterai</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Alamat Penerima *</label>
                  <textarea
                    name="receiver_address"
                    value={editForm.receiver_address}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                    required
                  />
                </div>
              </div>

              {/* Package Details */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Detail Paket</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">Isi Paket *</label>
                  <textarea
                    name="isi_paket"
                    value={editForm.isi_paket}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                    placeholder="Deskripsi isi paket"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Berat (kg) *</label>
                    <input
                      type="number"
                      name="weight"
                      value={editForm.weight}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Panjang (cm) *</label>
                    <input
                      type="number"
                      name="length"
                      value={editForm.length}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lebar (cm) *</label>
                    <input
                      type="number"
                      name="width"
                      value={editForm.width}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tinggi (cm) *</label>
                    <input
                      type="number"
                      name="height"
                      value={editForm.height}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Identity Documents */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dokumen Identitas (Opsional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kode Pos Penerima</label>
                    <input
                      type="text"
                      name="kode_pos_penerima"
                      value={editForm.kode_pos_penerima}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Penerima</label>
                    <input
                      type="email"
                      name="email_penerima"
                      value={editForm.email_penerima}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nomor Identitas Penerima</label>
                    <input
                      type="text"
                      name="nomor_identitas_penerima"
                      value={editForm.nomor_identitas_penerima}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Foto Alamat</label>
                    <input
                      type="file"
                      name="foto_alamat"
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                    {selectedTransaction.foto_alamat && (
                      <p className="text-xs text-gray-500 mt-1">File saat ini: {selectedTransaction.foto_alamat}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanda Pengenal Depan</label>
                    <input
                      type="file"
                      name="tanda_pengenal_depan"
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                    {selectedTransaction.tanda_pengenal_depan && (
                      <p className="text-xs text-gray-500 mt-1">File saat ini: {selectedTransaction.tanda_pengenal_depan}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanda Pengenal Belakang</label>
                    <input
                      type="file"
                      name="tanda_pengenal_belakang"
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                    {selectedTransaction.tanda_pengenal_belakang && (
                      <p className="text-xs text-gray-500 mt-1">File saat ini: {selectedTransaction.tanda_pengenal_belakang}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default TransactionManagement;