export type JenisPenelitian = 'Kuantitatif' | 'Kualitatif' | 'Belum tahu';

export const PERSETUJUAN_VERSI_SAAT_INI = '1.0';

export const SEMESTER_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  'Lebih dari 14',
] as const;

export const JENIS_PENELITIAN_OPTIONS: readonly JenisPenelitian[] = [
  'Kuantitatif',
  'Kualitatif',
  'Belum tahu',
] as const;

/**
 * Batas panjang karakter yang disinkronkan persis dengan firebase-blueprint.json dan firestore.rules.
 */
export const FIELD_LIMITS = {
  namaLengkap: 120,
  universitas: 160,
  fakultas: 120,
  prodi: 120,
  semester: 30,
  judulSkripsi: 300,
  jenisPenelitian: 30,
  dosenPembimbing1: 120,
  dosenPembimbing2: 120,
  targetSidang: 40,
  persetujuanVersi: 20,
  persetujuanAt: 40,
  email: 254,
} as const;

export type UserPlan = 'free' | 'premium';

export type SumberPremium = 'bayar' | 'manual' | 'promo' | 'trial' | null;

export interface UserProfile {
  uid: string;
  email: string;
  namaLengkap: string;
  universitas: string;
  fakultas: string;
  prodi: string;
  semester: string;
  judulSkripsi: string;
  jenisPenelitian: JenisPenelitian | '';
  dosenPembimbing1: string;
  dosenPembimbing2: string;
  targetSidang: string;
  plan: UserPlan;
  premiumUntil: string | null;
  sumberPremium: SumberPremium;
  persetujuanVersi: string;
  persetujuanAt: string;
  onboardingSelesai: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OnboardingPayload {
  namaLengkap: string;
  universitas: string;
  fakultas: string;
  prodi: string;
  semester: string;
  judulSkripsi: string;
  jenisPenelitian: JenisPenelitian;
  dosenPembimbing1: string;
  dosenPembimbing2: string;
  targetSidang: string;
}
