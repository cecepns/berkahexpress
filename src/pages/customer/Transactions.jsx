import React, { useEffect, useMemo, useState } from 'react';
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
    weight: '',
    length: '',
    width: '',
    height: '',
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
      } catch (e) {
        // handled globally
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedPrice = useMemo(() => {
    return prices.find((p) => p.country === form.destination) || null;
  }, [prices, form.destination]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { destination, weight, length, width, height } = form;
    if (!destination || !weight || !length || !width || !height) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      await transactionAPI.createTransaction({
        destination,
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
      });
      toast.success('Transaksi berhasil dibuat');
      setForm({ destination: '', weight: '', length: '', width: '', height: '' });
      const res = await transactionAPI.getUserTransactions();
      setTransactions(res.data.data || []);
      // refresh profile/balance after successful transaction
      refreshProfile();
    } catch (e) {
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
          <label className="block text-sm font-medium mb-1">Tujuan (Negara)</label>
          <select
            name="destination"
            className="w-full border rounded px-3 py-2"
            value={form.destination}
            onChange={handleChange}
          >
            <option value="">Pilih tujuan</option>
            {prices.map((p) => (
              <option key={p.id} value={p.country}>
                {p.country} (Rp{Number(p.price_per_kg).toLocaleString('id-ID')}/kg, Rp{Number(p.price_per_volume).toLocaleString('id-ID')}/m³)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Berat (kg)</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Panjang (cm)</label>
            <input type="number" name="length" value={form.length} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lebar (cm)</label>
            <input type="number" name="width" value={form.width} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tinggi (cm)</label>
            <input type="number" name="height" value={form.height} onChange={handleChange} className="w-full border rounded px-3 py-2" min="0" />
          </div>
        </div>

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
                <td className="p-2">{t.resi}</td>
                <td className="p-2">{t.destination}</td>
                <td className="p-2">{Number(t.weight)}</td>
                <td className="p-2">{Number(t.volume).toFixed(3)}</td>
                <td className="p-2">{Number(t.total_price).toLocaleString('id-ID')}</td>
                <td className="p-2 capitalize">{t.status}</td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan="7">Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;


