import { useEffect, useMemo, useState } from 'react';
import { priceAPI, transactionAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Transactions = () => {
  const { refreshProfile } = useAuth();
  const [prices, setPrices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    destination: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    item_category: 'NORMAL',
    weight: '',
    length: '',
    width: '',
    height: '',
    kode_pos_penerima: '',
    nomor_identitas_penerima: '',
    email_penerima: '',
  });
  
  const [files, setFiles] = useState({
    foto_alamat: null,
    tanda_pengenal_depan: null,
    tanda_pengenal_belakang: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [priceRes, trxRes] = await Promise.all([
          priceAPI.getAllPrices(),
          transactionAPI.getUserTransactions(),
        ]);
        setPrices(priceRes.data.data || []);
        setTransactions(trxRes.data.data || []);
      } catch {
        // handled globally
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedPrice = useMemo(() => {
    return prices.find((p) => p.country === form.destination && p.category === form.item_category) || null;
  }, [prices, form.destination, form.item_category]);

  const estimate = useMemo(() => {
    if (!selectedPrice) return null;
    const weight = Number(form.weight || 0);
    const length = Number(form.length || 0);
    const width = Number(form.width || 0);
    const height = Number(form.height || 0);
    const volume = (length * width * height) / 1000000; // m3
    const weightPrice = weight * selectedPrice.price_per_kg;
    const volumePrice = volume * selectedPrice.price_per_volume;
    const total = Math.max(weightPrice, volumePrice);
    return { volume, total };
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
    const { destination, receiver_name, receiver_phone, receiver_address, item_category, weight, length, width, height, kode_pos_penerima, nomor_identitas_penerima, email_penerima } = form;
    
    // Basic validation
    if (!destination || !receiver_name || !receiver_phone || !receiver_address || !item_category || !weight || !length || !width || !height) {
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
      formData.append('destination', destination);
      formData.append('receiver_name', receiver_name);
      formData.append('receiver_phone', receiver_phone);
      formData.append('receiver_address', receiver_address);
      formData.append('item_category', item_category);
      formData.append('weight', Number(weight));
      formData.append('length', Number(length));
      formData.append('width', Number(width));
      formData.append('height', Number(height));
      
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
        destination: '', 
        receiver_name: '',
        receiver_phone: '',
        receiver_address: '',
        item_category: 'NORMAL',
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
      
      const res = await transactionAPI.getUserTransactions();
      setTransactions(res.data.data || []);
      // refresh profile/balance after successful transaction
      refreshProfile();
    } catch {
      // handled globally
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Transaksi Pengiriman</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Tujuan (Negara) . </label>
          <select
            name="destination"
            className="w-full border rounded px-3 py-2"
            value={form.destination}
            onChange={handleChange}
            required
          >
            <option value="">Pilih tujuan</option>
            {prices.map((p) => (
              <option key={p.id} value={p.country}>
                {p.country} (Rp{Number(p.price_per_kg).toLocaleString('id-ID')}/kg, Rp{Number(p.price_per_volume).toLocaleString('id-ID')}/m³)
              </option>
            ))}
          </select>
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
              <option value="NORMAL">Normal</option>
              <option value="SENSITIF">Sensitif</option>
              <option value="BATERAI">Baterai</option>
            </select>
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
        {selectedPrice?.is_identity && (
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
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            Perkiraan total biaya: <span className="font-semibold">Rp{Number(estimate.total).toLocaleString('id-ID')}</span>
            <span className="ml-2 text-gray-600">(menggunakan berat vs volume yang lebih besar)</span>
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
              <th className="text-left p-2">Volume (m³)</th>
              <th className="text-left p-2">Total (Rp)</th>
              <th className="text-left p-2">Status</th>
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
                <td className="p-2">{Number(t.volume).toFixed(3)}</td>
                <td className="p-2">{Number(t.total_price).toLocaleString('id-ID')}</td>
                <td className="p-2 capitalize">{t.status}</td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan="8">Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;


