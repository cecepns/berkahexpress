import { useEffect, useMemo, useState } from 'react';
import { priceAPI, transactionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PrinterIcon, EyeIcon, MapPinIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { printResiInNewWindow, downloadResiAsPDF } from '../../utils/printResi';
import Select from 'react-select';

const Transactions = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
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
  
  const [files, setFiles] = useState({
    foto_alamat: null,
    tanda_pengenal_depan: null,
    tanda_pengenal_belakang: null,
  });

  const handlePrint = (transaction) => {
    if (!transaction) {
      toast.error('Data transaksi tidak tersedia');
      return;
    }
    printResiInNewWindow(transaction, true);
  };

  const handleDownloadPDF = async (transaction) => {
    if (!transaction) {
      toast.error('Data transaksi tidak tersedia');
      return;
    }
    try {
      toast.info('Generating PDF...');
      await downloadResiAsPDF(transaction, true);
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const openDetailModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleTrackPackage = (resi) => {
    navigate(`/tracking?resi=${resi}`);
  };

  const handleReorder = (transaction) => {
    // Fill form with transaction data
    setForm({
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
    
    // Close modal
    setShowDetailModal(false);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    toast.info('Form telah diisi dengan data orderan sebelumnya');
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

  useEffect(() => {
    const load = async () => {
      try {
        const [priceRes, trxRes] = await Promise.all([
          priceAPI.getAllPrices(),
          transactionAPI.getUserTransactions(currentPage, 10),
        ]);
        setPrices(priceRes.data.data || []);
        setTransactions(trxRes.data.data || []);
        setTotalPages(trxRes.data.totalPages || 1);
      } catch {
        // handled globally
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage]);

  const destinationOptions = useMemo(() => {
    // Group prices by country to show unique countries
    const countryMap = new Map();
    prices.forEach((p) => {
      if (!countryMap.has(p.country)) {
        countryMap.set(p.country, p);
      }
    });
    
    return Array.from(countryMap.values()).map((p) => ({
      value: p.country,
      label: `${p.country} ${p.use_tiered_pricing ? '(Harga Bertingkat ⚡)' : `(Rp${Number(p.price_per_kg).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/kg, Rp${Number(p.price_per_volume).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/kg vol)`}`,
      priceData: p
    }));
  }, [prices]);

  const selectedPrice = useMemo(() => {
    return prices.find((p) => p.country === form.destination && p.category === form.item_category) || null;
  }, [prices, form.destination, form.item_category]);

  const estimate = useMemo(() => {
    if (!selectedPrice) return null;
    const weight = Number(form.weight || 0);
    const length = Number(form.length || 0);
    const width = Number(form.width || 0);
    const height = Number(form.height || 0);
    const volume = (length * width * height) / 5000; // volume weight in kg
    
    // Use the larger value between actual weight and volume weight for tier selection
    const effectiveWeight = Math.max(weight, volume);
    
    let pricePerKg = selectedPrice.price_per_kg;
    let pricePerVolume = selectedPrice.price_per_volume;
    
    // If using tiered pricing, find the appropriate tier based on effective weight
    if (selectedPrice.use_tiered_pricing && selectedPrice.tiers && selectedPrice.tiers.length > 0) {
      const applicableTier = selectedPrice.tiers.find(tier => {
        const minWeight = Number(tier.min_weight || 0);
        const maxWeight = tier.max_weight ? Number(tier.max_weight) : Infinity;
        return effectiveWeight >= minWeight && effectiveWeight <= maxWeight;
      });
      
      if (applicableTier) {
        pricePerKg = Number(applicableTier.price_per_kg);
        pricePerVolume = Number(applicableTier.price_per_volume);
      }
    }
    
    const weightPrice = weight * pricePerKg;
    const volumePrice = volume * pricePerVolume;
    const total = Math.max(weightPrice, volumePrice);
    return { volume, total, pricePerKg, pricePerVolume };
  }, [form, selectedPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { sender_name, sender_phone, sender_address, destination, receiver_name, receiver_phone, receiver_address, item_category, weight, length, width, height, isi_paket, kode_pos_penerima, nomor_identitas_penerima, email_penerima } = form;
    
    // Basic validation
    if (!sender_name || !sender_phone || !sender_address || !destination || !receiver_name || !receiver_phone || !receiver_address || !item_category || !weight || !length || !width || !height || !isi_paket) {
      toast.error('Semua field wajib diisi');
      return;
    }

    // Validate identity documents if required
    if (selectedPrice?.is_identity) {
      if (!files.foto_alamat || !files.tanda_pengenal_depan || !files.tanda_pengenal_belakang) {
        toast.error('Dokumen identitas wajib diupload untuk negara tujuan ini');
        return;
      }
      if (!nomor_identitas_penerima) {
        toast.error('Nomor identitas penerima wajib diisi');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('sender_name', sender_name);
      formData.append('sender_phone', sender_phone);
      formData.append('sender_address', sender_address);
      formData.append('destination', destination);
      formData.append('receiver_name', receiver_name);
      formData.append('receiver_phone', receiver_phone);
      formData.append('receiver_address', receiver_address);
      formData.append('item_category', item_category);
      formData.append('weight', Number(weight));
      formData.append('length', Number(length));
      formData.append('width', Number(width));
      formData.append('height', Number(height));
      formData.append('isi_paket', isi_paket);
      
      // Add optional fields if they exist
      if (kode_pos_penerima) formData.append('kode_pos_penerima', kode_pos_penerima);
      if (nomor_identitas_penerima) formData.append('nomor_identitas_penerima', nomor_identitas_penerima);
      if (email_penerima) formData.append('email_penerima', email_penerima);
      
      // Add files if they exist
      if (files.foto_alamat) formData.append('foto_alamat', files.foto_alamat);
      if (files.tanda_pengenal_depan) formData.append('tanda_pengenal_depan', files.tanda_pengenal_depan);
      if (files.tanda_pengenal_belakang) formData.append('tanda_pengenal_belakang', files.tanda_pengenal_belakang);

      await transactionAPI.createTransaction(formData);
      toast.success('Transaksi berhasil dibuat');
      
      // Reset form
      setForm({ 
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
        kode_pos_penerima: '',
        nomor_identitas_penerima: '',
        email_penerima: '',
      });
      setFiles({
        foto_alamat: null,
        tanda_pengenal_depan: null,
        tanda_pengenal_belakang: null,
      });
      
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');
      
      const res = await transactionAPI.getUserTransactions(currentPage, 10);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      // refresh profile/balance after successful transaction
      refreshProfile();
    } catch {
      // handled globally
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-4">Transaksi Pengiriman</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Sender Information Section */}
        <div className="border-b pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Pengirim</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Pengirim *</label>
              <input 
                type="text" 
                name="sender_name" 
                value={form.sender_name} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Nama lengkap pengirim"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Telepon Pengirim *</label>
              <input 
                type="tel" 
                name="sender_phone" 
                value={form.sender_phone} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="+628123456789"
                required 
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Alamat Lengkap Pengirim *</label>
            <textarea 
              name="sender_address" 
              value={form.sender_address} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2" 
              rows="3"
              placeholder="Alamat lengkap pengirim"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tujuan (Negara) / Sensitive / Battery </label>
          <Select
            name="destination"
            options={destinationOptions}
            value={destinationOptions.find(opt => opt.value === form.destination) || null}
            onChange={(selectedOption) => {
              setForm((prev) => ({ ...prev, destination: selectedOption ? selectedOption.value : '' }));
            }}
            placeholder="Pilih tujuan..."
            isClearable
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '42px',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#9ca3af'
                }
              })
            }}
          />
        </div>

        {/* Receiver Information Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Penerima</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Penerima *</label>
              <input 
                type="text" 
                name="receiver_name" 
                value={form.receiver_name} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Nama lengkap penerima"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Telepon Penerima *</label>
              <input 
                type="tel" 
                name="receiver_phone" 
                value={form.receiver_phone} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="+60123456789"
                required 
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Alamat Lengkap Penerima *</label>
            <textarea 
              name="receiver_address" 
              value={form.receiver_address} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2" 
              rows="3"
              placeholder="Alamat lengkap penerima di negara tujuan"
              required
            />
          </div>
        </div>

        {/* Package Details Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Detail Paket</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Kategori Barang *</label>
            <select
              name="item_category"
              className="w-full border rounded px-3 py-2"
              value={form.item_category}
              onChange={handleChange}
              required
            >
              <option value="REGULER">Normal</option>
              <option value="SENSITIF">Sensitif</option>
              <option value="BATERAI">Baterai</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Isi Paket *</label>
            <textarea 
              name="isi_paket" 
              value={form.isi_paket} 
              onChange={handleChange} 
              className="w-full border rounded px-3 py-2" 
              rows="2"
              placeholder="Deskripsi singkat isi paket (contoh: Buku, Elektronik, Pakaian, dll)"
              required
            />
          </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Berat (kg) *</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Panjang (cm) *</label>
            <input type="number" name="length" value={form.length} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lebar (cm) *</label>
            <input type="number" name="width" value={form.width} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tinggi (cm) *</label>
            <input type="number" name="height" value={form.height} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" required />
          </div>
        </div>
        </div>

        {/* Identity Documents Section - Show if destination requires identity */}
        {!!selectedPrice?.is_identity && (
          <div className="border-t pt-4 bg-yellow-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dokumen Identitas Penerima (Wajib)
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Negara tujuan ini memerlukan dokumen identitas penerima. Harap upload semua dokumen yang diperlukan.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email Penerima</label>
                <input 
                  type="email" 
                  name="email_penerima" 
                  value={form.email_penerima} 
                  onChange={handleChange} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kode Pos Penerima</label>
                <input 
                  type="text" 
                  name="kode_pos_penerima" 
                  value={form.kode_pos_penerima} 
                  onChange={handleChange} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Nomor Identitas Penerima *</label>
              <input 
                type="text" 
                name="nomor_identitas_penerima" 
                value={form.nomor_identitas_penerima} 
                onChange={handleChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="Nomor KTP/Passport/ID Card penerima"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Foto Alamat Penerima *</label>
                <input 
                  type="file" 
                  name="foto_alamat" 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full border rounded px-3 py-2" 
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload foto alamat lengkap penerima</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tanda Pengenal Depan *</label>
                <input 
                  type="file" 
                  name="tanda_pengenal_depan" 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full border rounded px-3 py-2" 
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload foto KTP/Passport/ID Card bagian depan</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tanda Pengenal Belakang *</label>
                <input 
                  type="file" 
                  name="tanda_pengenal_belakang" 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full border rounded px-3 py-2" 
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload foto KTP/Passport/ID Card bagian belakang</p>
              </div>
            </div>
          </div>
        )}

        {estimate && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm space-y-1">
            <div>
              Perkiraan total biaya: <span className="font-semibold text-lg">Rp{Number(estimate.total).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-xs text-gray-600">
              {selectedPrice?.use_tiered_pricing && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded mr-2">
                  ⚡ Harga Bertingkat - Rp{Number(estimate.pricePerKg).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/kg
                </span>
              )}
              <span>Berat: {form.weight} kg × Rp{Number(estimate.pricePerKg).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = Rp{(Number(form.weight) * estimate.pricePerKg).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-xs text-gray-600">
              <span>Volume Weight: {estimate.volume.toFixed(2)} kg × Rp{Number(estimate.pricePerVolume).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = Rp{(estimate.volume * estimate.pricePerVolume).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-xs text-gray-500 italic">
              * Sistem menggunakan yang lebih besar antara perhitungan berat dan volume
            </div>
          </div>
        )}

        <button type="submit" disabled={submitting} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60">
          {submitting ? 'Memproses...' : 'Buat Transaksi'}
        </button>
      </form>

      <h2 className="text-lg font-semibold mt-8 mb-3">Riwayat Transaksi</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Resi</th>
              <th className="text-left p-2">Tujuan</th>
              <th className="text-left p-2">Penerima</th>
              <th className="text-left p-2">Berat (kg)</th>
              <th className="text-left p-2">Vol Weight (kg)</th>
              <th className="text-left p-2">Total (Rp)</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-2 font-mono text-xs">{t.resi}</td>
                <td className="p-2">{t.destination}</td>
                <td className="p-2">
                  <div className="text-sm">{t.receiver_name || '-'}</div>
                  <div className="text-xs text-gray-500">{t.receiver_phone || ''}</div>
                </td>
                <td className="p-2">{Number(t.weight)}</td>
                <td className="p-2">{Number(t.volume).toFixed(2)}</td>
                <td className="p-2">
                  {t.status?.toLowerCase() === 'canceled' ? (
                    <span className="text-green-600 font-semibold">
                      +Rp{Number(t.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      <span className="block text-xs">saldo dikembalikan</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Rp{Number(t.total_price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDetailModal(t)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTrackPackage(t.resi)}
                      className="text-purple-600 hover:text-purple-900 p-1"
                      title="Lacak Paket"
                    >
                      <MapPinIcon className="h-4 w-4" />
                    </button>
                    {/* <button
                      onClick={() => handlePrint(t)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Cetak Resi"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </button> */}
                    <button
                      onClick={() => handleDownloadPDF(t)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan="9">Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
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
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white my-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Detail Transaksi
            </h3>
            
            <div className="space-y-4">
              {/* Transaction Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Resi</label>
                <p className="mt-1 text-sm font-mono font-semibold text-gray-900">{selectedTransaction.resi}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* {selectedTransaction.expedition_resi && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resi Ekspedisi</label>
                  <p className="mt-1 text-sm font-mono font-semibold text-blue-600">{selectedTransaction.expedition_resi}</p>
                </div>
              )} */}

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
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Detail Paket</h4>
                {selectedTransaction.isi_paket && (
                  <p className="text-sm text-gray-900 mb-3"><strong>Isi Paket:</strong> {selectedTransaction.isi_paket}</p>
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

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReorder(selectedTransaction)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                  title="Buat pesanan baru dengan data yang sama"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reorder
                </button>
                <button
                  onClick={() => handleTrackPackage(selectedTransaction.resi)}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2"
                >
                  <MapPinIcon className="h-5 w-5" />
                  Lacak Paket
                </button>
              </div>
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
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Transactions;


