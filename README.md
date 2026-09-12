# IHP Kukar

Aplikasi entri dan perhitungan **Indeks Harga Pasar Kabupaten Kutai Kartanegara**.
Menggantikan berkas Excel: harga mingguan dientri lewat browser, IHK, m-to-m, YtD, YoY,
dan andil dihitung otomatis dengan rumus yang sama persis, lengkap dengan pemeriksaan
anti-salah-entri sebelum data disimpan.

**Alamat aplikasi:** `https://mrafiraamadhan.github.io/ihp-kukar/` (aktif setelah GitHub Pages dinyalakan)

---

## Untuk petugas entri

1. Buka alamat aplikasi, masuk ke tab **Pengaturan**, lalu masuk dengan email dan kata sandi
   yang diberikan admin.
2. Buka tab **Entri harga**, pilih periode (bulan dan minggu), isi harga 20 komoditas.
   - Di bawah setiap kotak isian muncul pembacaan balik, misalnya `= Rp17.100`. Pastikan itu
     sesuai maksudmu — di situlah salah titik atau koma paling sering ketahuan.
   - Kolom **Catatan** menandai harga yang mencurigakan: lompatan besar dari minggu lalu,
     kemungkinan salah jumlah digit, atau menyimpang jauh dari level beberapa minggu terakhir.
   - Tombol **Salin minggu lalu** ada kalau harga memang tidak berubah, tapi sengaja dibuat
     sebagai tindakan sadar, bukan isian otomatis.
3. Panel kanan menampilkan pratinjau IHK dan inflasi **sebelum** disimpan. Kalau angkanya
   terasa aneh, periksa ulang entrinya.
4. Tombol **Simpan periode** baru aktif setelah 20 harga terisi dan tidak ada catatan merah.

Hasilnya langsung bisa dilihat di tab **Hasil** dan **Tren**, dan bisa diunduh sebagai
Excel atau CSV di tab **Data & ekspor**.

---

## Untuk admin: memasang dari nol

### 1. Buat repo di GitHub

- Buka <https://github.com/new>
- **Repository name:** `ihp-kukar`
- Pilih **Public**, jangan centang "Add a README file"
- Klik **Create repository**

### 2. Unggah berkas

Di halaman repo yang baru dibuat, klik **uploading an existing file**, lalu seret
seluruh isi folder ini (folder `assets`, `data`, `supabase`, berkas `index.html`,
`README.md`, dan `.nojekyll`) ke jendela unggah. Klik **Commit changes**.

> Berkas `.nojekyll` kelihatannya kosong tapi penting — tanpa itu GitHub Pages
> kadang mengabaikan folder tertentu.

### 3. Nyalakan GitHub Pages

- Repo → **Settings** → **Pages**
- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)` → **Save**
- Tunggu satu-dua menit, alamatnya muncul di halaman yang sama.

Sampai di sini aplikasi sudah terbuka dan bisa membaca riwayat, tapi belum bisa menyimpan
entri baru. Lanjut ke Supabase.

### 4. Buat proyek Supabase

- Daftar di <https://supabase.com> (gratis), klik **New project**
- Beri nama, pilih region terdekat (Singapore), simpan kata sandi basis datanya
- Tunggu proyeknya siap (sekitar dua menit)

### 5. Buat tabelnya

- Supabase → **SQL Editor** → **New query**
- Buka berkas `supabase/schema.sql` di repo ini, salin seluruh isinya, tempel, klik **Run**
- Akan terbentuk tabel `entri_harga` dan `log_perubahan`, beserta aturan aksesnya

### 6. Sambungkan aplikasi ke Supabase

- Supabase → **Project Settings** → **API**, salin **Project URL** dan **anon public** key
- Di GitHub, buka `assets/config.js`, klik ikon pensil, ganti dua nilainya, **Commit changes**

```js
window.IHP_CONFIG = {
  url:     "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi..."
};
```

Anon key memang aman berada di repo publik — yang menjaga data adalah aturan Row Level
Security yang sudah dipasang di langkah 5, bukan kerahasiaan kunci ini.

### 7. Buat akun petugas

- Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
- Isi email dan kata sandi, centang **Auto Confirm User**
- Ulangi untuk setiap petugas

**Penting:** matikan pendaftaran mandiri supaya orang luar tidak bisa membuat akun sendiri.
Supabase → **Authentication** → **Sign In / Providers** → **Email** → matikan
**Allow new users to sign up** → Save.

Selesai. Muat ulang alamat aplikasinya, masuk, dan entri sudah bisa disimpan.

---

## Struktur berkas

```
index.html              halaman aplikasi
assets/style.css        tampilan
assets/app.js           antarmuka dan mesin hitung
assets/config.js        alamat dan kunci Supabase  <- satu-satunya yang perlu diedit
data/baseline.json      riwayat harga Des 2021 - Juli 2026, daftar komoditas, bobot NK0
supabase/schema.sql     tabel, jejak audit, dan aturan akses
```

Riwayat sampai Juli 2026 tersimpan di `baseline.json` dan tidak berubah. Entri mulai
Agustus 2026 tersimpan di Supabase dan ditumpangkan di atas riwayat itu saat dihitung.

---

## Cara perhitungannya

```
Relatif Harga   RH(t) = harga(t) / harga minggu ke-4 bulan sebelumnya x 100   (bulat 4 desimal)
Nilai Konsumsi  NK(t) = RH(t) x NK minggu ke-4 bulan sebelumnya / 100         (bulat 2 desimal)
                        berjangkar di September 2022, NK = NK0 (bobot SBH)
IHK             = NK / NK0 x 100                                              (bulat 2 desimal)
m-to-m          = IHK(t) / IHK minggu ke-4 bulan lalu - 1
YtD             = IHK(t) / IHK Desember tahun lalu - 1
YoY             = IHK(t) / IHK bulan yang sama tahun lalu - 1
Bobot (WN-1)    = NK komoditas bulan lalu / NK umum bulan lalu x 100
Andil           = bobot x m-to-m / 100                                        (bulat 2 desimal)
```

Angka resmi bulanan adalah kolom **minggu ke-4**.

Mesin hitung ini diuji terhadap berkas Excel yang lama: seluruh 2.856 sel IHK bulanan
dan minggu ke-4 cocok persis. Perbedaan yang disengaja hanya di kolom mingguan Juni dan
Juli 2026 minggu 2-3, karena rumus di Excel tersebut berantai ke minggu sebelumnya
sementara seluruh bulan lain sejak Mei 2024 berantai ke minggu ke-4 bulan sebelumnya.
Aplikasi ini memakai aturan yang konsisten.

---

## Catatan data

Riwayat di `baseline.json` sudah memuat koreksi Juli 2026: harga lima komoditas
(beras, susu bubuk, susu bubuk balita, tahu mentah, tempe) disetel ulang sepanjang
Desember 2021 sampai Juni 2026 agar angka IHK, m-to-m, YtD, YoY, dan andil tetap sama
dengan yang sudah dipublikasikan, sementara harga Juli 2026 memakai data yang benar.
Harga ikan kembung Oktober 2022 juga sudah dibetulkan dari 4.471,36 menjadi 44.721,36.
