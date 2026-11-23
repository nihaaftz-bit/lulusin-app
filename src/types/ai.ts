export type AiChatMode = 'chat' | 'simulasi_sidang' | 'analisis_bab';

export type AiChatRole = 'user' | 'assistant';

export interface AiChatMessage {
  uid: string;
  pesanId: string;
  percakapanId: string;
  mode: AiChatMode;
  role: AiChatRole;
  teks: string;
  createdAtIso: string;
  createdAt: unknown;
}

export interface AiUsageRecord {
  uid: string;
  dateKey: string;
  count: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface SafeThesisContext {
  judulSkripsi: string;
  jenisPenelitian: string;
  tahapAktif: string;
}

export const AI_QUICK_SUGGESTIONS = [
  {
    id: 'rumuskan_masalah',
    label: 'Bantu rumuskan masalah',
    prompt:
      'Bantu saya menyusun atau mempertajam rumusan masalah skripsi yang selaras dengan judul dan jenis penelitian saya. Tolong ajukan 2–3 pertanyaan pemantik dulu agar kita bisa merumuskannya bersama.',
  },
  {
    id: 'cek_alur_logika',
    label: 'Cek alur logika bab',
    prompt:
      'Saya ingin mengecek alur logika bab skripsi saya. Tolong jelaskan poin-poin keterkaitan logis apa saja yang perlu saya periksa terlebih dahulu sebelum saya menempelkan ringkasan isi babnya.',
  },
  {
    id: 'buat_outline',
    label: 'Buat outline',
    prompt:
      'Bantu saya membuat kerangka (outline) subbab yang runtut untuk tahap skripsi yang sedang saya kerjakan sekarang, dan ingatkan bagian mana yang perlu saya sesuaikan dengan panduan kampus.',
  },
  {
    id: 'jelaskan_metode',
    label: 'Jelaskan metode penelitian',
    prompt:
      'Jelaskan konsep dan langkah-langkah inti metode penelitian yang cocok dengan jenis penelitian saya dengan bahasa yang mudah dipahami mahasiswa S1.',
  },
] as const;

export const SIMULASI_SIDANG_TOPICS = [
  {
    id: 'latar_belakang',
    label: 'Uji Latar Belakang & Masalah',
    prompt:
      'Mulai simulasi sidang tahap awal: ajukan 1 pertanyaan penguji tentang urgensi masalah, gap penelitian, dan ketepatan rumusan masalah berdasarkan judul serta jenis penelitian saya. Jangan beri jawabannya dulu, tunggu saya menjawab.',
  },
  {
    id: 'metodologi',
    label: 'Uji Metodologi & Instrumen',
    prompt:
      'Mulai simulasi sidang bagian metodologi: ajukan 1 pertanyaan penguji yang menantang alasan pemilihan metode, teknik pengumpulan data/sampel, atau rencana analisis sesuai jenis penelitian saya. Tunggu jawaban saya sebelum memberi umpan balik.',
  },
  {
    id: 'hasil_keterbatasan',
    label: 'Uji Pembahasan & Keterbatasan',
    prompt:
      'Mulai simulasi sidang tahap akhir: ajukan 1 pertanyaan penguji tentang bagaimana saya mempertanggungjawabkan temuan, keterbatasan penelitian, dan konsistensi kesimpulan dengan rumusan masalah. Tunggu jawaban saya dulu.',
  },
] as const;

export const ANALISIS_BAB_OPTIONS = [
  'Bab 1 — Pendahuluan',
  'Bab 2 — Tinjauan Pustaka',
  'Bab 3 — Metodologi Penelitian',
  'Bab 4 — Hasil & Pembahasan',
  'Bab 5 — Penutup / Kesimpulan',
  'Bagian / Subbab Lainnya',
] as const;
