# Spesifikasi Keamanan Firestore — Lulusin (Tahap 1–5 + Fase 2A + Fase 2B)

## 1. Invarian Data
1. Pengguna hanya boleh membaca (`get`), membuat (`create`), memperbarui (`update`), atau menghapus (`delete`) dokumen `/users/{userId}` serta membaca/menulis subkoleksi miliknya sendiri (`request.auth.uid == userId`) dengan email terverifikasi (`request.auth.token.email_verified == true`).
2. Operasi `list` pada koleksi induk `/users` hanya diizinkan untuk akun admin terverifikasi (`request.auth.token.email == 'nihaaftz@gmail.com' && request.auth.token.email_verified == true`). Pengguna biasa selalu ditolak agar daftar pengguna tidak pernah bocor.
3. Admin hanya boleh membaca/memperbarui field paket (`plan`, `premiumUntil`, `sumberPremium`, `updatedAt`) pada `/users/{userId}` dan **dilarang** membaca atau mengubah subkoleksi catatan skripsi maupun riwayat AI (`roadmapTahap`, `roadmapTugas`, `bimbingan`, `revisi`, `referensi`, `aiChats`, `aiUsage`) milik pengguna lain.
4. Field `plan` wajib bernilai `"free"`, `premiumUntil` wajib `null`, dan `sumberPremium` wajib `null` saat dokumen dibuat, serta **tidak boleh** diubah oleh pengguna biasa pada operasi `update`.
5. Field `uid`, `createdAt`, `tahapId`, `tugasId`, `bimbinganId`, `revisiId`, `referensiId`, `pesanId`, `dateKey`, dan `feedbackId` bersifat immutable setelah dibuat.
6. Jika `onboardingSelesai == true`, field wajib profil (`namaLengkap`, `universitas`, `prodi`, `jenisPenelitian`) tidak boleh kosong.
7. Setiap `roadmapTugas` baru harus merujuk pada `tahapId` yang benar-benar ada di `/users/{userId}/roadmapTahap/{tahapId}`.
8. Array `tindakLanjut` pada `bimbingan` dibatasi maksimal 15 item; array `penulis` pada `referensi` dibatasi maksimal 20 item dan `tag` maksimal 10 item dengan validasi tipe elemen indeks awal.
9. Setiap query `list` pada `roadmapTahap`, `roadmapTugas`, `bimbingan`, `revisi`, `referensi`, `aiChats`, dan `aiUsage` wajib menyertakan filter `uid == request.auth.uid`.
10. Dokumen `/users/{userId}/aiUsage/{dateKey}` wajib ber-ID `YYYY-MM-DD`, memiliki `count` integer `>= 0` dan `<=` batas paket pengguna (`10` untuk Gratis, `100` untuk Premium), hanya bertambah (`incoming().count == existing().count + 1` pada `update`, dan `<= 1` pada `create`), serta tidak dapat dihapus selama dokumen induk `/users/{userId}` masih ada (mencegah reset kuota harian).
11. Dokumen `/users/{userId}/aiChats/{pesanId}` membatasi panjang `teks` maksimal 16.000 karakter dan melarang modifikasi pasca-buat (`update: false`).
12. Koleksi `/feedback/{feedbackId}` bersifat write-only dari sisi klien terverifikasi (`create` hanya dengan `uid == request.auth.uid`); `get`, `list`, `update`, dan `delete` ditolak sepenuhnya agar masukan pengguna tidak pernah bocor ke pengguna lain.

## 2. Dirty Dozen Payloads (Harus menghasilkan PERMISSION_DENIED)
1. **Cross-user read (`users` & `aiChats`)**: User biasa A (`uidA`) mencoba `get` ke `/users/uidB` atau `/users/uidB/aiChats`.
2. **Cross-user read oleh admin (`bimbingan` / `revisi` / `referensi` / `aiChats`)**: Admin mencoba `get` atau `list` ke `/users/uidB/aiChats`.
3. **Unfiltered subcollection list**: User A mencoba `list` pada `/users/uidA/aiChats` tanpa filter `where('uid', '==', uidA)`.
4. **Non-admin user list (`/users`) & unverified admin spoof**: User biasa (atau token dengan `email == 'nihaaftz@gmail.com'` tetapi `email_verified == false`) mencoba `list` pada `/users`.
5. **Quota negative / overflow (`aiUsage`)**: User Gratis mencoba menulis `count: -1` atau `count: 11` (atau User Premium mencoba `count: 101`) ke `/users/uidA/aiUsage/2026-11-23`.
6. **Quota reset / delete bypass (`aiUsage`)**: User A mencoba menurunkan `count` dari `10` ke `0` atau menghapus `/users/uidA/aiUsage/2026-11-23` saat akunnya masih aktif.
7. **Self-upgrade / package tampering**: User A mencoba mengubah `plan`, `premiumUntil`, maupun `sumberPremium` pada `/users/uidA`.
8. **Shadow/ghost field injection**: User A menambahkan field `isAdmin: true` atau `pdfUrl` pada `users`, `aiChats`, `aiUsage`, atau `referensi`.
9. **Resource poisoning (oversized string / invalid dateKey)**: User A mengirim `teks` AI > 16.000 karakter, `dateKey` `"not-a-date"`, atau `catatan` > 2.000 karakter.
10. **Orphaned task creation**: User A mencoba membuat `roadmapTugas` dengan `tahapId` yang tidak ada di `roadmapTahap`.
11. **Invalid enum**: User A mengirim `mode: "admin_hack"` atau `role: "system"` di `aiChats`, atau `sumberPremium: "hacked"`.
12. **Client-forged timestamp**: User A atau admin mengirim `createdAt` atau `updatedAt` bukan `serverTimestamp()` (`request.time`).
