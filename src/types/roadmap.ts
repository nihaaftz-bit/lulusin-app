import type { JenisPenelitian } from './user';

export type SumberTemplate = JenisPenelitian | 'Kustom';

export type StatusTahap = 'selesai' | 'sedang_berjalan' | 'belum_mulai';

export const ROADMAP_LIMITS = {
  judulTahap: 120,
  deskripsiTahap: 240,
  judulTugas: 200,
  tenggat: 40,
  maxItems: 50,
} as const;

export interface RoadmapTahap {
  uid: string;
  tahapId: string;
  judul: string;
  deskripsi: string;
  urutan: number;
  tersembunyi: boolean;
  sumberTemplate: SumberTemplate;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoadmapTugas {
  uid: string;
  tugasId: string;
  tahapId: string;
  judul: string;
  selesai: boolean;
  tenggat: string;
  urutan: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BimbinganJadwalItem {
  id: string;
  judul: string;
  dosen?: string;
  tanggalIso: string;
  selesai: boolean;
}

export interface RevisiItem {
  id: string;
  judul: string;
  sumber?: string;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  tenggat: string;
  selesai: boolean;
}
