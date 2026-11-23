export type SumberRevisiKategori = 'Pembimbing 1' | 'Pembimbing 2' | 'Penguji' | 'Lainnya';
export type PrioritasRevisi = 'Tinggi' | 'Sedang' | 'Rendah';
export type StatusRevisi = 'Belum' | 'Dikerjakan' | 'Selesai';

export const SUMBER_REVISI_OPTIONS: readonly SumberRevisiKategori[] = [
  'Pembimbing 1',
  'Pembimbing 2',
  'Penguji',
  'Lainnya',
] as const;

export const PRIORITAS_REVISI_OPTIONS: readonly PrioritasRevisi[] = [
  'Tinggi',
  'Sedang',
  'Rendah',
] as const;

export const STATUS_REVISI_OPTIONS: readonly StatusRevisi[] = [
  'Belum',
  'Dikerjakan',
  'Selesai',
] as const;

export const BIMBINGAN_LIMITS = {
  dosen: 120,
  topik: 160,
  ringkasan: 2000,
  tindakLanjutMax: 15,
  tindakLanjutJudul: 200,
  maxItems: 50,
} as const;

export const REVISI_LIMITS = {
  isi: 500,
  sumberNama: 120,
  tenggat: 40,
  maxItems: 50,
} as const;

export interface TindakLanjutItem {
  id: string;
  judul: string;
  selesai: boolean;
  roadmapTugasId: string;
}

export interface BimbinganRecord {
  uid: string;
  bimbinganId: string;
  tanggalIso: string;
  dosen: string;
  topik: string;
  ringkasan: string;
  tindakLanjut: TindakLanjutItem[];
  selesai: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RevisiRecord {
  uid: string;
  revisiId: string;
  isi: string;
  sumberKategori: SumberRevisiKategori;
  sumberNama: string;
  prioritas: PrioritasRevisi;
  tenggat: string;
  status: StatusRevisi;
  createdAt?: unknown;
  updatedAt?: unknown;
}
