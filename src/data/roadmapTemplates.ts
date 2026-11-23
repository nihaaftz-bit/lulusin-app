import type { JenisPenelitian } from '../types/user';

export interface TemplateTahapSeed {
  judul: string;
  deskripsi: string;
  tugas: string[];
}

const TEMPLATE_KUANTITATIF: TemplateTahapSeed[] = [
  {
    judul: 'Pengajuan Topik',
    deskripsi: 'Menentukan topik terukur, variabel penelitian, dan mengajukan judul ke prodi.',
    tugas: [
      'Cari 5–10 jurnal terbaru untuk pemetaan topik',
      'Rumuskan variabel X, Y, dan kerangka berpikir awal',
      'Diskusikan rancangan topik dengan dosen pembimbing',
      'Ajukan formulir judul skripsi ke jurusan/prodi',
    ],
  },
  {
    judul: 'Proposal (Bab 1–3)',
    deskripsi: 'Menyusun latar belakang, tinjauan pustaka, hipotesis, dan desain metode kuantitatif.',
    tugas: [
      'Tulis Bab 1: latar belakang, rumusan masalah, dan tujuan',
      'Tulis Bab 2: kajian teori, kerangka berpikir, dan hipotesis',
      'Tulis Bab 3: populasi, sampel, definisi operasional, dan rencana analisis',
      'Lengkapi daftar pustaka proposal sesuai gaya sitasi kampus',
    ],
  },
  {
    judul: 'Seminar Proposal',
    deskripsi: 'Mempresentasikan proposal dan memperbaiki rancangan instrumen sebelum turun lapangan.',
    tugas: [
      'Siapkan salindia presentasi seminar proposal',
      'Lengkapi berkas administrasi pendaftaran sempro',
      'Presentasikan proposal di seminar proposal',
      'Catat dan rapikan masukan penguji untuk Bab 1–3',
    ],
  },
  {
    judul: 'Uji Instrumen & Pengumpulan Data',
    deskripsi: 'Menguji validitas kuesioner/instrumen dan mengumpulkan data responden.',
    tugas: [
      'Susun kisi-kisi dan butir kuesioner atau lembar tes',
      'Lakukan uji coba (pilot test) validitas dan reliabilitas instrumen',
      'Urus surat izin penelitian ke lokasi atau instansi terkait',
      'Sebarkan kuesioner dan kumpulkan data sesuai target sampel',
    ],
  },
  {
    judul: 'Olah Data Statistik & Bab 4–5',
    deskripsi: 'Mengolah angka dengan uji statistik dan menyusun pembahasan serta simpulan.',
    tugas: [
      'Rapikan tabulasi data mentah dan cek kelengkapan jawaban',
      'Lakukan uji asumsi dan uji hipotesis (SPSS / R / JASP / SmartPLS)',
      'Tulis Bab 4: deskripsi data, hasil uji statistik, dan pembahasan',
      'Tulis Bab 5: simpulan, keterbatasan penelitian, dan saran',
    ],
  },
  {
    judul: 'Seminar Hasil',
    deskripsi: 'Memaparkan temuan data statistik dan mendapatkan masukan akhir sebelum sidang.',
    tugas: [
      'Susun ringkasan hasil uji statistik ke dalam salindia',
      'Minta persetujuan dosen pembimbing untuk maju seminar hasil',
      'Ikuti seminar hasil dan catat poin perbaikan',
    ],
  },
  {
    judul: 'Sidang Akhir',
    deskripsi: 'Ujian komprehensif skripsi untuk mempertanggungjawabkan hasil penelitian.',
    tugas: [
      'Cek kelengkapan syarat administrasi dan cek plagiarisme (Turnitin)',
      'Latihan presentasi 10–15 menit dan siapkan jawaban pertanyaan umum',
      'Ikuti sidang skripsi sesuai jadwal yang ditetapkan',
    ],
  },
  {
    judul: 'Revisi Final',
    deskripsi: 'Menuntaskan revisi pasca-sidang hingga pengesahan dan unggah repositori.',
    tugas: [
      'Kerjakan seluruh daftar revisi dari dewan penguji',
      'Minta tanda tangan lembar pengesahan pembimbing dan penguji',
      'Unggah naskah final ke repositori/perpustakaan kampus',
    ],
  },
];

const TEMPLATE_KUALITATIF: TemplateTahapSeed[] = [
  {
    judul: 'Pengajuan Topik',
    deskripsi: 'Menemukan fenomena, konteks lapangan, dan fokus pertanyaan penelitian kualitatif.',
    tugas: [
      'Amati fenomena lapangan dan baca 5–10 studi terdahulu',
      'Rumuskan fokus penelitian dan pertanyaan eksploratif awal',
      'Diskusikan kelayakan akses informan/lokasi dengan pembimbing',
      'Ajukan topik skripsi ke jurusan/prodi',
    ],
  },
  {
    judul: 'Proposal (Bab 1–3)',
    deskripsi: 'Menyusun konteks masalah, perspektif teori, dan strategi pengumpulan data lapangan.',
    tugas: [
      'Tulis Bab 1: konteks fenomena, fokus masalah, dan manfaat',
      'Tulis Bab 2: kajian literatur dan konsep pendukung',
      'Tulis Bab 3: pendekatan kualitatif, teknik informan, dan uji keabsahan data',
      'Susun draf pedoman wawancara dan lembar observasi awal',
    ],
  },
  {
    judul: 'Seminar Proposal',
    deskripsi: 'Mempresentasikan rancangan studi kualitatif dan mematangkan pedoman lapangan.',
    tugas: [
      'Buat salindia presentasi fokus dan desain lapangan',
      'Daftarkan diri dan lengkapi syarat seminar proposal',
      'Presentasikan proposal di seminar proposal',
      'Perbaiki pedoman wawancara sesuai saran penguji',
    ],
  },
  {
    judul: 'Pengumpulan Data Lapangan',
    deskripsi: 'Melakukan wawancara mendalam, observasi, dan dokumentasi hingga data jenuh.',
    tugas: [
      'Urus surat izin penelitian dan hubungi informan kunci',
      'Lakukan wawancara mendalam serta tulis catatan lapangan',
      'Susun transkrip wawancara secara rapi dan lengkap',
      'Kumpulkan dokumen pendukung untuk bahan triangulasi',
    ],
  },
  {
    judul: 'Analisis Tematik & Bab 4–5',
    deskripsi: 'Mengodekan transkrip, menarik tema utama, dan menuliskan narasi temuan.',
    tugas: [
      'Lakukan koding transkrip dan pengelompokan tema utama',
      'Lakukan triangulasi sumber atau member check dengan informan',
      'Tulis Bab 4: paparan temuan lapangan, kutipan, dan pembahasan teori',
      'Tulis Bab 5: simpulan, implikasi, dan saran',
    ],
  },
  {
    judul: 'Seminar Hasil',
    deskripsi: 'Menguji ketajaman analisis tematik bersama dosen pembimbing dan penguji.',
    tugas: [
      'Siapkan salindia alur tema dan kutipan kunci informan',
      'Minta persetujuan pembimbing untuk seminar hasil',
      'Ikuti seminar hasil dan catat masukan perbaikan',
    ],
  },
  {
    judul: 'Sidang Akhir',
    deskripsi: 'Mempertanggungjawabkan temuan kualitatif dan keabsahan analisis di depan penguji.',
    tugas: [
      'Pastikan lampiran transkrip dan dokumen izin sudah lengkap',
      'Cek kemiripan naskah dan tata tulis sesuai panduan kampus',
      'Ikuti sidang akhir skripsi',
    ],
  },
  {
    judul: 'Revisi Final',
    deskripsi: 'Menyelesaikan revisi naskah akhir hingga pengesahan dan yudisium.',
    tugas: [
      'Tuntaskan seluruh revisi redaksi dan analisis dari penguji',
      'Lengkapi tanda tangan lembar pengesahan',
      'Serahkan naskah final ke prodi dan perpustakaan kampus',
    ],
  },
];

const TEMPLATE_UMUM: TemplateTahapSeed[] = [
  {
    judul: 'Pengajuan Topik',
    deskripsi: 'Menentukan topik yang realistis, diminati, dan disetujui program studi.',
    tugas: [
      'Kumpulkan 5–10 referensi utama untuk mencari celah penelitian',
      'Tulis ringkasan masalah dan tujuan penelitian dalam 1 halaman',
      'Konsultasikan ide topik ke dosen pembimbing',
      'Ajukan formulir pendaftaran judul skripsi',
    ],
  },
  {
    judul: 'Proposal',
    deskripsi: 'Menyusun Bab 1–3 secara utuh sebagai dasar rencana penelitian.',
    tugas: [
      'Tulis Bab 1 (Pendahuluan) dan rumusan masalah',
      'Tulis Bab 2 (Tinjauan Pustaka) dari referensi terpercaya',
      'Tulis Bab 3 (Metodologi) sesuai arahan pembimbing',
      'Rapikan kutipan dan daftar pustaka proposal',
    ],
  },
  {
    judul: 'Seminar Proposal',
    deskripsi: 'Mempresentasikan rencana penelitian untuk memperoleh masukan sebelum riset.',
    tugas: [
      'Siapkan salindia presentasi proposal yang ringkas',
      'Urus persyaratan administrasi seminar proposal',
      'Ikuti seminar proposal dan catat seluruh masukan dosen',
      'Selesaikan revisi proposal sebelum mulai ambil data',
    ],
  },
  {
    judul: 'Pengumpulan Data',
    deskripsi: 'Mengumpulkan data primer atau sekunder sesuai metode yang dipilih.',
    tugas: [
      'Siapkan instrumen atau sumber data yang dibutuhkan',
      'Urus surat izin pengumpulan data jika diperlukan',
      'Kumpulkan data dan simpan salinan cadangannya dengan aman',
    ],
  },
  {
    judul: 'Pengolahan & Penulisan',
    deskripsi: 'Menganalisis data yang terkumpul dan menulis Bab 4 serta Bab 5.',
    tugas: [
      'Olah dan analisis data secara bertahap',
      'Tulis Bab 4: paparan hasil dan pembahasan',
      'Tulis Bab 5: simpulan dan saran penelitian',
      'Bimbingan rutin untuk menyempurnakan draf lengkap',
    ],
  },
  {
    judul: 'Seminar Hasil',
    deskripsi: 'Memaparkan hasil penelitian sebelum masuk ke ujian akhir.',
    tugas: [
      'Buat salindia ringkasan hasil dan simpulan',
      'Ajukan persetujuan seminar hasil ke pembimbing',
      'Ikuti seminar hasil dan catat revisi yang diperlukan',
    ],
  },
  {
    judul: 'Sidang Akhir',
    deskripsi: 'Ujian akhir skripsi bersama dewan penguji.',
    tugas: [
      'Lengkapi syarat administrasi dan cek plagiarisme kampus',
      'Siapkan presentasi dan pahami poin-poin inti tiap bab',
      'Ikuti sidang akhir skripsi',
    ],
  },
  {
    judul: 'Revisi Final',
    deskripsi: 'Tahap penuntasan revisi akhir hingga bebas pustaka dan pengesahan.',
    tugas: [
      'Perbaiki seluruh catatan revisi dari penguji',
      'Kumpulkan tanda tangan lembar pengesahan resmi',
      'Unggah naskah final ke perpustakaan atau repositori kampus',
    ],
  },
];

export function ambilTemplateRoadmap(jenisPenelitian: JenisPenelitian | ''): TemplateTahapSeed[] {
  if (jenisPenelitian === 'Kuantitatif') return TEMPLATE_KUANTITATIF;
  if (jenisPenelitian === 'Kualitatif') return TEMPLATE_KUALITATIF;
  return TEMPLATE_UMUM;
}
