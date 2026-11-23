# Lulusin — MVP Pendamping Skripsi Mahasiswa S1

Aplikasi web pendamping skripsi yang tenang dan jelas untuk membantu mahasiswa S1 di Indonesia memantau tahap skripsi, mencatat hasil bimbingan, melacak revisi, dan menyimpan referensi.

## Menjalankan di Lingkungan Lokal / Proyek Firebase Sendiri

Di Google AI Studio, konfigurasi proyek Firebase dan aturan keamanan (`firestore.rules`) sudah disiapkan secara otomatis melalui `firebase-applet-config.json`. Jika Anda ingin memindahkan atau menjalankan aplikasi di proyek Firebase Anda sendiri:

1. **Buat proyek Firebase**
   - Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru.
   - Tambahkan aplikasi Web (`</>`), lalu salin konfigurasi `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, dan `appId`.

2. **Aktifkan Google Sign-In di Authentication**
   - Masuk ke menu **Authentication** -> **Sign-in method**.
   - Aktifkan provider **Google**, pilih email dukungan proyek, lalu simpan.

3. **Tambahkan Authorized domains**
   - Di **Authentication** -> **Settings** -> **Authorized domains**, tambahkan domain tempat aplikasi dijalankan (misalnya `localhost` untuk lokal, atau domain Cloud Run / hosting Anda).

4. **Buat Cloud Firestore & terapkan `firestore.rules`**
   - Aktifkan **Firestore Database** (disarankan region `asia-southeast2` / Jakarta).
   - Buka tab **Rules**, salin seluruh isi file `firestore.rules` dari repositori ini, lalu klik **Publish** (atau jalankan `firebase deploy --only firestore:rules`).

5. **Atur variabel environment (opsional untuk di luar AI Studio)**
   - Salin `.env.example` menjadi `.env` dan isi nilai `VITE_FIREBASE_*` sesuai proyek Anda. Jika kosong, aplikasi otomatis membaca `firebase-applet-config.json`.
