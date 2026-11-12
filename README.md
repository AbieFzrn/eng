# English Sentence Builder 🎮🔤

**English Sentence Builder** adalah aplikasi game edukasi berbasis web yang dirancang untuk membantu siswa melatih kemampuan menyusun kalimat bahasa Inggris secara interaktif dan *real-time*. 

Aplikasi ini menggunakan arsitektur multiplayer berbasis **Firebase Realtime Database** dan mesin permainan **Phaser 4** yang diintegrasikan ke dalam antarmuka modern **React 19** dan **Tailwind CSS v4**.

---

## 🌟 Fitur Utama

- **Mode Guru / Host (Room Manager):**
  - Buat ruang permainan (*Room*) berproteksi kata sandi dengan kode unik 6 karakter.
  - Kustomisasi parameter permainan: jumlah ronde, jumlah kalimat per ronde, batas waktu per ronde, kecepatan gerak kartu kata (*still, slow, normal, fast*), batas putar ulang audio, dan bobot skor.
  - Editor kalimat: gunakan preset bawaan atau input kalimat kustom lengkap dengan kata pengecoh (*distractors*).
  - Kontrol jalannya permainan: memulai ronde, jeda antar ronde, hingga mengeluarkan (*kick*) pemain.
  - *Live Leaderboard*: memantau progres dan peringkat pemain secara langsung saat permainan berlangsung.

- **Mode Siswa / Pemain:**
  - Bergabung cepat hanya dengan memasukkan Kode Room, Password, dan Nama.
  - Autentikasi anonim instan tanpa perlu registrasi manual.
  - Gameplay interaktif berbasis Phaser: susun kartu kata ke area jawaban dengan benar sebelum waktu habis.
  - Feedback visual dan audio instan saat jawaban benar atau salah.

- **Papan Peringkat Akhir (Podium / Result):**
  - Pengumuman pemenang dan rangkuman poin akhir seluruh pemain setelah semua ronde selesai.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend Core:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Game Engine:** [Phaser 4](https://phaser.io/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication & Realtime Database)

---

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan Anda telah memasang:
- **Node.js** versi 18.0.0 atau lebih baru (disarankan LTS v20+)
- **npm** (biasanya terpasang bersama Node.js) atau manajer paket lain (**yarn** / **pnpm**)
- Akun **Google Firebase** (gratis)

---

## 🚀 Panduan Instalasi & Pengaturan

### 1. Kloning Repositori & Buka Direktori

Buka terminal dan masuk ke folder proyek:
```bash
cd english_sentence_builder
```

### 2. Pasang Dependensi

Jalankan perintah berikut untuk mengunduh semua pustaka yang dibutuhkan:
```bash
npm install
```

---

### 3. Konfigurasi Firebase

Proyek ini membutuhkan layanan **Firebase Authentication** dan **Firebase Realtime Database**. Ikuti langkah-langkah berikut:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru (atau gunakan proyek yang sudah ada).
2. **Aktifkan Autentikasi Anonim:**
   - Masuk ke menu **Build > Authentication** > tab **Sign-in method**.
   - Aktifkan provider **Anonymous** lalu klik **Save**.
3. **Aktifkan Realtime Database:**
   - Masuk ke menu **Build > Realtime Database** lalu buat basis data (pilih region terdekat).
   - Buka tab **Rules**, lalu salin isi file `database.rules.json` yang ada di proyek ini dan tempelkan ke editor aturan Firebase, kemudian klik **Publish**.
4. **Dapatkan Kunci Konfigurasi Web App:**
   - Buka **Project Settings** (ikon gerigi di samping *Project Overview*).
   - Di bagian *Your apps*, pilih platform Web (ikon `</>`) dan daftarkan aplikasi.
   - Salin nilai konfigurasi Firebase (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`).

---

### 4. Konfigurasi Variabel Lingkungan (`.env`)

Buat salinan file `.env.example` menjadi `.env` di *root* direktori proyek:
```bash
# Untuk Windows PowerShell:
Copy-Item .env.example .env

# Untuk Linux / macOS / Bash:
cp .env.example .env
```

Buka file `.env` lalu masukkan nilai konfigurasi dari Firebase Console:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=proyek-anda.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://proyek-anda-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=proyek-anda
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

---

## 💻 Menjalankan Aplikasi

### Mode Pengembangan (Development)
Untuk menjalankan server lokal dengan fitur Hot Module Replacement (HMR):
```bash
npm run dev
```
Buka browser dan akses alamat yang tertera di terminal (biasanya `http://localhost:5173`).

### Build untuk Produksi (Production Build)
Untuk melakukan kompilasi proyek menjadi aset siap rilis:
```bash
npm run build
```
File hasil kompilasi akan berada di folder `dist/`.

Untuk menguji hasil build secara lokal:
```bash
npm run preview
```

### Pengecekan Kode (Linting)
Untuk memeriksa kualitas kode menggunakan ESLint:
```bash
npm run lint
```

---

## 📖 Panduan Pemakaian

### A. Sebagai Guru / Host (Pembuat Room)

1. **Membuat Room:**
   - Buka halaman utama aplikasi.
   - Klik tombol **"Buat Room Baru (Mode Guru)"**.
   - Masukkan **Password Room** (minimal 4 karakter) yang nantinya digunakan oleh siswa.
2. **Mengatur Konfigurasi Permainan:**
   - Tentukan **Jumlah Ronde** (1–20) dan **Jumlah Kalimat per Ronde** (1–50).
   - Atur **Batas Waktu** (dalam detik; isi `0` jika tanpa batas waktu).
   - Pilih **Kecepatan Kata** (*Still* / Diam, *Slow*, *Normal*, atau *Fast*).
   - Atur efek suara (*SFX*) dan musik latar jika diperlukan.
   - Tambahkan kalimat yang ingin diuji beserta kata pengecoh (*distractors*) melalui editor kalimat, atau gunakan daftar kalimat default.
   - Klik **"Simpan & Buat Room"**.
3. **Mengelola Lobby & Memulai Game:**
   - Anda akan mendapatkan **Kode Room (6 karakter)** unik. Bagikan kode ini beserta password kepada para siswa.
   - Pantau nama-nama siswa yang masuk di ruang tunggu (Lobby).
   - Jika semua siswa sudah siap, klik tombol **"Mulai Game"**.
4. **Selama & Pasca Permainan:**
   - Selama permainan berlangsung, layar Host menampilkan papan peringkat (*Live Leaderboard*) secara *real-time*.
   - Saat ronde selesai, Host dapat melanjutkan ke ronde berikutnya atau menyelesaikan permainan.
   - Di akhir permainan, podium pemenang akan ditampilkan.

---

### B. Sebagai Siswa / Pemain

1. **Bergabung ke Room:**
   - Buka halaman utama aplikasi.
   - Isi form **"Gabung ke Room"**:
     - **Kode Room**: Masukkan 6 karakter kode room dari guru.
     - **Password**: Masukkan kata sandi room.
     - **Nama**: Masukkan nama panggilan atau nama lengkap Anda.
   - Klik tombol **"Masuk Room"**.
2. **Menunggu di Ruang Tunggu (Lobby):**
   - Anda akan berada di ruang tunggu bersama pemain lain sampai guru memulai permainan.
3. **Memainkan Game:**
   - Saat permainan dimulai, kartu-kartu kata akan muncul di layar.
   - Klik atau seret (*drag-and-drop*) kata-kata tersebut ke area kotak jawaban di bawah sesuai dengan susunan tata bahasa Inggris yang benar.
   - Selesaikan penyusunan sebelum waktu ronde habis untuk mendapatkan poin dan bonus waktu (*time bonus*).
4. **Melihat Hasil:**
   - Setelah semua ronde berakhir, Anda dapat melihat total skor dan peringkat akhir Anda di halaman hasil (*Result Page*).

---

## 📁 Struktur Direktori

```text
english_sentence_builder/
├── public/                 # Aset statis (audio sfx/musik, favicon)
├── src/
│   ├── components/         # Komponen UI React (Lobby, HostControls, PhaserGame, dll.)
│   ├── config/             # Konfigurasi Firebase dan konstanta permainan
│   ├── data/               # Bank kalimat default dan skema validasi
│   ├── game/               # Logika Phaser 4 (Scene, Objek Kartu, Audio, Timer, Skor)
│   ├── hooks/              # Custom hooks React (useAuth, useRoom, useLeaderboard)
│   ├── pages/              # Halaman utama (HomePage, LobbyPage, GamePage, dll.)
│   ├── services/           # Komunikasi dengan Firebase (auth, room, player)
│   ├── state/              # Global state management dengan Zustand
│   └── utils/              # Fungsi helper utilitas & parser kalimat
├── .env.example            # Contoh template variabel lingkungan
├── database.rules.json     # Aturan keamanan Firebase Realtime Database
├── firebase.json           # Konfigurasi deployment Firebase
├── package.json            # Daftar dependensi dan script npm
└── vite.config.js          # Konfigurasi build Vite & Tailwind
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
