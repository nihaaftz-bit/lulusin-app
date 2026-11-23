export type JenisReferensi = 'jurnal' | 'buku' | 'web' | 'lainnya';
export type StatusBacaReferensi = 'Belum dibaca' | 'Sudah dibaca';

export const JENIS_REFERENSI_OPTIONS: readonly JenisReferensi[] = [
  'jurnal',
  'buku',
  'web',
  'lainnya',
] as const;

export const STATUS_BACA_OPTIONS: readonly StatusBacaReferensi[] = [
  'Belum dibaca',
  'Sudah dibaca',
] as const;

export const JURNAL_LIMITS = {
  judul: 300,
  penulisItem: 120,
  penulisMax: 20,
  tahun: 10,
  namaSumber: 200,
  volumeInfo: 80,
  tautan: 500,
  doi: 150,
  catatan: 2000,
  tagItem: 40,
  tagMax: 10,
  pageSize: 50,
  maxItems: 200,
} as const;

export interface ReferensiRecord {
  uid: string;
  referensiId: string;
  judul: string;
  penulis: string[];
  tahun: string;
  jenis: JenisReferensi;
  namaSumber: string;
  volumeInfo: string;
  tautan: string;
  doi: string;
  catatan: string;
  tag: string[];
  statusBaca: StatusBacaReferensi;
  createdAt?: unknown;
  updatedAt?: unknown;
}
