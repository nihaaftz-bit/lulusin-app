import type { UserPlan } from '../types/user';

export type PremiumFeatureKey =
  | 'ekspor_ringkasan_bimbingan'
  | 'ekspor_revisi_laporan'
  | 'ekspor_sitasi_massal'
  | 'simulasi_sidang'
  | 'analisis_alur_bab';

export interface PremiumFeatureConfig {
  key: PremiumFeatureKey;
  judul: string;
  deskripsiSingkat: string;
  konteksHalaman: string;
}

export interface PlanComparisonRow {
  fitur: string;
  gratis: string;
  premium: string;
}

export interface PlanLimitDefinition {
  id: UserPlan;
  nama: string;
  subjudul: string;
  hargaAngka: number;
  hargaLabel: string;
  durasiHari: number;
  periodeLabel: string;
  batasRoadmapTugas: number;
  batasBimbingan: number;
  batasRevisi: number;
  batasReferensi: number;
  kuotaAiHarian: number;
  eksporJsonPribadi: boolean;
  salinRingkasanSiapCetak: boolean;
}

const DEFAULT_WHATSAPP_UPGRADE_URL =
  'https://wa.me/6281200000000?text=Halo%20Lulusin%2C%20saya%20tertarik%20upgrade%20ke%20paket%20Lulusin%20Premium%20(Rp19.000%2F30%20hari).';

function getUpgradeWhatsappUrl(): string {
  const fromEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_UPGRADE_WHATSAPP_URL as string | undefined)
      : undefined;
  return fromEnv?.trim() || DEFAULT_WHATSAPP_UPGRADE_URL;
}

export const PLAN_CONFIG = {
  hargaPremiumAngka: 19000,
  hargaPremiumLabel: 'Rp19.000',
  durasiPremiumHari: 30,
  periodePremiumLabel: '30 hari',
  hargaLengkapLabel: 'Rp19.000 / 30 hari',
  bannerTutupHari: 7,
  upgradeWhatsappUrl: getUpgradeWhatsappUrl(),
  aiLimits: {
    chatMaxKarakter: 4000,
    analisisBabMaxKarakter: 15000,
    pesanSimpanMaxKarakter: 16000,
    jedaKirimDetik: 3,
    riwayatMaksPesan: 50,
  },
  paket: {
    free: {
      id: 'free',
      nama: 'Gratis',
      subjudul: 'Untuk mulai merapikan skripsi sehari-hari',
      hargaAngka: 0,
      hargaLabel: 'Rp0',
      durasiHari: 0,
      periodeLabel: 'Selamanya',
      batasRoadmapTugas: 50,
      batasBimbingan: 50,
      batasRevisi: 50,
      batasReferensi: 200,
      kuotaAiHarian: 10,
      eksporJsonPribadi: true,
      salinRingkasanSiapCetak: false,
    },
    premium: {
      id: 'premium',
      nama: 'Premium',
      subjudul: 'Untuk persiapan bimbingan, revisi & sidang lebih cepat',
      hargaAngka: 19000,
      hargaLabel: 'Rp19.000',
      durasiHari: 30,
      periodeLabel: '30 hari',
      batasRoadmapTugas: 50,
      batasBimbingan: 50,
      batasRevisi: 50,
      batasReferensi: 200,
      kuotaAiHarian: 100,
      eksporJsonPribadi: true,
      salinRingkasanSiapCetak: true,
    },
  } satisfies Record<UserPlan, PlanLimitDefinition>,
  manfaatUtama: [
    {
      judul: 'Asisten AI 100 pesan/hari + Analisis Alur Bab',
      deskripsi:
        'Konsultasi lebih leluasa hingga 100 pesan/hari serta tempel draf hingga 15.000 karakter untuk cek koherensi antar paragraf dan subbab.',
    },
    {
      judul: 'Mode Simulasi Sidang bersama penguji AI',
      deskripsi:
        'Latihan tanya-jawab penguji berlapis sesuai judul dan jenis penelitianmu lengkap dengan umpan balik jawaban.',
    },
    {
      judul: 'Salin logbook bimbingan, revisi & sitasi sekaligus',
      deskripsi:
        'Rangkum catatan pertemuan, status revisi, dan seluruh daftar pustaka APA 7 siap tempel kapan saja.',
    },
  ],
  fiturGerbang: {
    ekspor_ringkasan_bimbingan: {
      key: 'ekspor_ringkasan_bimbingan',
      judul: 'Salin Logbook Bimbingan',
      deskripsiSingkat:
        'Salin rangkuman sesi bimbingan beserta status tindak lanjut dalam format rapi siap tempel.',
      konteksHalaman: 'Bimbingan',
    },
    ekspor_revisi_laporan: {
      key: 'ekspor_revisi_laporan',
      judul: 'Salin Ringkasan Revisi',
      deskripsiSingkat:
        'Salin daftar revisi pembimbing & penguji yang dikelompokkan per status untuk arsip sidang.',
      konteksHalaman: 'Revisi',
    },
    ekspor_sitasi_massal: {
      key: 'ekspor_sitasi_massal',
      judul: 'Salin Semua Sitasi APA 7',
      deskripsiSingkat:
        'Salin seluruh daftar referensi yang tampil dalam urutan alfabetis format APA 7 sekaligus.',
      konteksHalaman: 'Jurnal & Referensi',
    },
    simulasi_sidang: {
      key: 'simulasi_sidang',
      judul: 'Simulasi Sidang AI',
      deskripsiSingkat:
        'Latihan tanya-jawab penguji berlapis berdasarkan judul dan jenis penelitianmu, lengkap dengan umpan balik jawaban.',
      konteksHalaman: 'Asisten AI',
    },
    analisis_alur_bab: {
      key: 'analisis_alur_bab',
      judul: 'Analisis Alur Bab',
      deskripsiSingkat:
        'Tempel draf tulisan hingga 15.000 karakter untuk mengecek koherensi logika antar paragraf dan subbab.',
      konteksHalaman: 'Asisten AI',
    },
  } satisfies Record<PremiumFeatureKey, PremiumFeatureConfig>,
  tabelPerbandingan: [
    {
      fitur: 'Roadmap skripsi & target sidang',
      gratis: 'Termasuk (hingga 50 tugas)',
      premium: 'Termasuk (hingga 50 tugas)',
    },
    {
      fitur: 'Catatan bimbingan & pelacak revisi',
      gratis: 'Termasuk (masing-masing hingga 50 item)',
      premium: 'Termasuk (masing-masing hingga 50 item)',
    },
    {
      fitur: 'Jurnal, tag & salin sitasi APA 7 per item',
      gratis: 'Termasuk (hingga 200 referensi)',
      premium: 'Termasuk (hingga 200 referensi)',
    },
    {
      fitur: 'Asisten AI pendamping skripsi (chat)',
      gratis: '10 pesan / hari',
      premium: '100 pesan / hari',
    },
    {
      fitur: 'Simulasi Sidang & Analisis Alur Bab (15.000 karakter)',
      gratis: 'Belum termasuk',
      premium: 'Tersedia penuh',
    },
    {
      fitur: 'Unduh seluruh data pribadi (JSON)',
      gratis: 'Selalu tersedia kapan saja',
      premium: 'Selalu tersedia kapan saja',
    },
    {
      fitur: 'Salin logbook bimbingan, revisi & semua sitasi sekaligus',
      gratis: 'Belum termasuk',
      premium: 'Tersedia penuh',
    },
  ] satisfies PlanComparisonRow[],
  faq: [
    {
      tanya: 'Apakah ada auto-debit atau perpanjangan otomatis?',
      jawab:
        'Tidak ada. Paket Premium berlaku untuk 30 hari per aktivasi tanpa auto-debit dan tanpa kartu kredit yang disimpan.',
    },
    {
      tanya: 'Apakah saya bisa berhenti kapan saja?',
      jawab:
        'Ya, kamu bebas berhenti kapan saja. Cukup tidak memperpanjang setelah masa aktif 30 hari selesai dan akunmu otomatis kembali ke paket Gratis.',
    },
    {
      tanya: 'Apa yang terjadi pada data skripsiku jika Premium berakhir?',
      jawab:
        'Semua catatan Roadmap, bimbingan, revisi, referensi, dan riwayat chat AI-mu tetap aman, tetap bisa dilihat, diedit, serta diunduh (JSON) kapan saja. Tidak ada data yang dikunci atau dihapus.',
    },
    {
      tanya: 'Bagaimana cara mengaktifkan Premium saat ini?',
      jawab:
        'Selama tahap fondasi ini belum memakai gerbang pembayaran otomatis, klik tombol Upgrade untuk menghubungi admin lewat WhatsApp agar akunmu diaktifkan selama 30 hari.',
    },
  ],
} as const;
