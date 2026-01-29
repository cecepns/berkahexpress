# Panduan Tiered Pricing (Harga Bertingkat)

## Overview
Fitur tiered pricing memungkinkan Anda untuk mengatur harga pengiriman yang berbeda berdasarkan range berat paket. Semakin berat paket, biasanya harga per kg bisa lebih murah.

## Contoh Use Case
```
1 Kg: Rp 210.000/Kg
2 Kg - 5 Kg: Rp 160.000/Kg
6 Kg - 10 Kg: Rp 150.000/Kg
11 Kg Lebih: Rp 140.000/Kg
```

## Cara Menggunakan

### 1. Migrasi Database
Jalankan migration file untuk membuat tabel `price_tiers`:
```bash
# Jalankan SQL migration di database MySQL
mysql -u [username] -p [database_name] < supabase/migrations/20250110_add_price_tiers.sql
```

### 2. Membuat Harga Baru dengan Tiered Pricing

1. Login sebagai Admin
2. Buka menu "Manajemen Harga"
3. Klik "Tambah Harga"
4. Isi negara dan kategori
5. **Centang "Gunakan Tiered Pricing (Harga Bertingkat)"**
6. Klik "Tambah Tier" untuk setiap range harga
7. Untuk setiap tier, isi:
   - **Min Berat**: Berat minimum untuk tier ini (contoh: 0, 2, 6, 11)
   - **Max Berat**: Berat maksimum (kosongkan untuk unlimited/∞)
   - **Harga Customer**: Harga per kg dan per m³ untuk customer biasa
   - **Harga Mitra**: Harga per kg dan per m³ untuk mitra

### 3. Contoh Konfigurasi Tier

**Tier 1**: 0 - 1.99 Kg
- Min: 0
- Max: 1.99
- Harga Customer: Rp 210.000/Kg
- Harga Mitra: Rp 180.000/Kg

**Tier 2**: 2 - 5.99 Kg
- Min: 2
- Max: 5.99
- Harga Customer: Rp 160.000/Kg
- Harga Mitra: Rp 140.000/Kg

**Tier 3**: 6 - 10.99 Kg
- Min: 6
- Max: 10.99
- Harga Customer: Rp 150.000/Kg
- Harga Mitra: Rp 130.000/Kg

**Tier 4**: 11+ Kg
- Min: 11
- Max: (kosongkan atau null)
- Harga Customer: Rp 140.000/Kg
- Harga Mitra: Rp 120.000/Kg

## Cara Kerja Backend

### 1. Database Schema
```sql
CREATE TABLE price_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  price_id INT NOT NULL,
  min_weight DECIMAL(10,2) NOT NULL,
  max_weight DECIMAL(10,2) DEFAULT NULL,  -- NULL = unlimited
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_per_volume DECIMAL(10,2) NOT NULL,
  price_per_kg_mitra DECIMAL(10,2) NOT NULL,
  price_per_volume_mitra DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (price_id) REFERENCES prices(id) ON DELETE CASCADE
);
```

### 2. Logic Perhitungan Harga
Ketika customer membuat transaksi:
1. System cek apakah price menggunakan tiered pricing (`use_tiered_pricing = true`)
2. Jika ya, cari tier yang sesuai berdasarkan berat:
   ```sql
   SELECT * FROM price_tiers 
   WHERE price_id = ? 
   AND min_weight <= [berat_paket]
   AND (max_weight >= [berat_paket] OR max_weight IS NULL)
   ORDER BY min_weight DESC
   LIMIT 1
   ```
3. Gunakan harga dari tier yang ditemukan
4. Hitung total: `MAX(berat × harga_per_kg, volume × harga_per_volume)`

### 3. API Endpoints

#### Get All Prices (with tiers)
```
GET /api/prices
Response: {
  success: true,
  data: [
    {
      id: 1,
      country: "Malaysia",
      category: "REGULER",
      use_tiered_pricing: true,
      tiers: [
        {
          min_weight: 0,
          max_weight: 1.99,
          price_per_kg: 210000,
          ...
        }
      ]
    }
  ]
}
```

#### Create Price with Tiers
```
POST /api/prices
Body: {
  country: "Malaysia",
  category: "REGULER",
  use_tiered_pricing: true,
  is_identity: false,
  tiers: [
    {
      min_weight: 0,
      max_weight: 1.99,
      price_per_kg: 210000,
      price_per_volume: 50000,
      price_per_kg_mitra: 180000,
      price_per_volume_mitra: 40000
    },
    {
      min_weight: 2,
      max_weight: 5.99,
      price_per_kg: 160000,
      price_per_volume: 40000,
      price_per_kg_mitra: 140000,
      price_per_volume_mitra: 35000
    }
  ]
}
```

#### Update Price with Tiers
```
PUT /api/prices/:id
Body: Same as create
```

## Testing

### 1. Test Create Tiered Price
```bash
curl -X POST http://localhost:5000/api/prices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "Malaysia",
    "category": "REGULER",
    "use_tiered_pricing": true,
    "is_identity": false,
    "tiers": [
      {
        "min_weight": 0,
        "max_weight": 1.99,
        "price_per_kg": 210000,
        "price_per_volume": 50000,
        "price_per_kg_mitra": 180000,
        "price_per_volume_mitra": 40000
      }
    ]
  }'
```

### 2. Test Transaction with Tiered Price
- Buat transaksi dengan berat berbeda
- Verifikasi harga yang digunakan sesuai dengan tier yang benar

### 3. Frontend Testing
1. Buka halaman Manajemen Harga
2. Tambah harga baru dengan tiered pricing
3. Edit harga existing dan ubah ke tiered pricing
4. Hapus tier
5. Verifikasi tampilan di tabel

## Troubleshooting

### Error: "No pricing tier found for this weight"
- Pastikan ada tier yang cover berat paket
- Periksa min_weight dan max_weight tidak ada gap
- Untuk berat unlimited, set max_weight = NULL

### Harga tidak sesuai
- Verifikasi role user (customer vs mitra)
- Cek apakah tier range sudah benar
- Pastikan tidak ada overlap antar tier

## Best Practices

1. **Tidak ada gap**: Pastikan range tier tidak ada gap
   - ✅ Tier 1: 0-1.99, Tier 2: 2-5.99
   - ❌ Tier 1: 0-1, Tier 2: 3-5 (ada gap 1-3)

2. **Tier terakhir unlimited**: Set max_weight = null untuk tier terakhir
   - ✅ Tier 4: min=11, max=null
   - ❌ Tier 4: min=11, max=100 (berat >100 akan error)

3. **Harga menurun**: Biasanya harga per kg menurun seiring berat naik
   - ✅ 1kg: Rp 200k, 5kg: Rp 150k
   - Tapi ini tidak wajib, tergantung business logic

4. **Volume pricing**: Jangan lupa set harga per volume juga untuk setiap tier

## Migration Rollback
Jika perlu rollback:
```sql
ALTER TABLE prices DROP COLUMN use_tiered_pricing;
DROP TABLE price_tiers;
```

