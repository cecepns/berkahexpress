import React, { useEffect, useState } from 'react';
import { accountAPI, topupAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Topup = () => {
  const { refreshProfile, isAuthenticated, isCustomer } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [topups, setTopups] = useState([]);
  const [form, setForm] = useState({ bank_account_id: '', amount: '', proof_image: null });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [accRes, topupRes] = await Promise.all([
        accountAPI.getAllAccounts(),
        topupAPI.getAllTopups(),
      ]);
      setAccounts(accRes.data.data || []);
      setTopups(topupRes.data.data || []);
      // also refresh profile to reflect any approved topups
      if (isAuthenticated && isCustomer) {
        refreshProfile();
      }
    } catch (e) {
      // handled by interceptor
    }
  };

  useEffect(() => {
    loadData();
    // poll while on this page to catch admin approvals
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proof_image') {
      setForm((prev) => ({ ...prev, proof_image: files && files[0] ? files[0] : null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bank_account_id || !form.amount || !form.proof_image) {
      toast.error('Semua field wajib diisi termasuk bukti transfer');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('bank_account_id', form.bank_account_id);
      fd.append('amount', form.amount);
      fd.append('proof_image', form.proof_image);
      await topupAPI.createTopup(fd);
      toast.success('Pengajuan topup berhasil dikirim');
      setForm({ bank_account_id: '', amount: '', proof_image: null });
      await loadData();
    } catch (e) {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Topup Saldo</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Rekening Tujuan</label>
          <select
            name="bank_account_id"
            className="w-full border rounded px-3 py-2"
            value={form.bank_account_id}
            onChange={handleChange}
          >
            <option value="">Pilih rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bank_name} - {acc.account_number} a.n {acc.account_holder}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nominal (IDR)</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            min="1000"
            step="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bukti Transfer (gambar)</label>
          <input
            type="file"
            name="proof_image"
            accept="image/*"
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
        </button>
      </form>

      <h2 className="text-lg font-semibold mt-8 mb-3">Riwayat Topup</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">Bank</th>
              <th className="text-left p-2">Nominal</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Bukti</th>
            </tr>
          </thead>
          <tbody>
            {topups.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-2">{t.bank_name} - {t.account_number}</td>
                <td className="p-2">Rp{Number(t.amount).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td className="p-2 capitalize">{t.status}</td>
                <td className="p-2">
                  {t.proof_image && (
                    <a
                      className="text-blue-600 hover:underline"
                      href={`https://api-inventory.isavralabel.com/berkahexpress/uploads/${t.proof_image}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lihat
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {topups.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan="5">Belum ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Topup;


