import { PLAN_CONFIG } from '../config/plans';
import type { SumberPremium, UserPlan, UserProfile } from '../types/user';

export const DEFAULT_ADMIN_EMAIL = 'nihaaftz@gmail.com';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getAdminEmail(): string {
  const fromEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)
      : undefined;
  return (fromEnv?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getAdminEmail();
}

export interface EffectivePlanStatus {
  effectivePlan: UserPlan;
  rawPlan: UserPlan;
  isExpired: boolean;
  premiumUntil: string | null;
  sisaHari: number | null;
  sumberPremium: SumberPremium;
}

/**
 * Mengevaluasi status paket efektif pengguna di UI:
 * Jika plan == 'premium' tetapi premiumUntil sudah lewat dari waktu sekarang,
 * kembalikan effectivePlan = 'free' tanpa pernah menghapus atau mengunci data.
 */
export function resolveEffectivePlan(
  profile: Pick<UserProfile, 'plan' | 'premiumUntil' | 'sumberPremium'> | null | undefined,
  now: Date = new Date()
): EffectivePlanStatus {
  const rawPlan: UserPlan = profile?.plan === 'premium' ? 'premium' : 'free';
  const premiumUntil = profile?.premiumUntil ?? null;
  const sumberPremium: SumberPremium = profile?.sumberPremium ?? null;

  if (rawPlan !== 'premium') {
    return {
      effectivePlan: 'free',
      rawPlan: 'free',
      isExpired: false,
      premiumUntil: null,
      sisaHari: null,
      sumberPremium: null,
    };
  }

  if (!premiumUntil) {
    return {
      effectivePlan: 'free',
      rawPlan: 'premium',
      isExpired: true,
      premiumUntil: null,
      sisaHari: 0,
      sumberPremium,
    };
  }

  const untilMs = Date.parse(premiumUntil);
  const nowMs = now.getTime();
  if (Number.isNaN(untilMs) || untilMs <= nowMs) {
    return {
      effectivePlan: 'free',
      rawPlan: 'premium',
      isExpired: true,
      premiumUntil,
      sisaHari: 0,
      sumberPremium,
    };
  }

  const sisaHari = Math.max(1, Math.ceil((untilMs - nowMs) / MS_PER_DAY));
  return {
    effectivePlan: 'premium',
    rawPlan: 'premium',
    isExpired: false,
    premiumUntil,
    sisaHari,
    sumberPremium,
  };
}

export function computePremiumUntilIso(
  hari: number = PLAN_CONFIG.durasiPremiumHari,
  fromDate: Date = new Date()
): string {
  const safeDays = Math.max(1, Math.floor(hari));
  return new Date(fromDate.getTime() + safeDays * MS_PER_DAY).toISOString();
}

export function formatSumberPremium(sumber: SumberPremium): string {
  switch (sumber) {
    case 'bayar':
      return 'Pembayaran langsung';
    case 'manual':
      return 'Aktivasi manual admin';
    case 'promo':
      return 'Promo';
    case 'trial':
      return 'Uji coba';
    default:
      return '-';
  }
}

export function getUpgradeBannerStorageKey(uid: string): string {
  return `lulusin_banner_upgrade_dismissed_${uid}`;
}

export function shouldShowUpgradeBanner(
  uid: string,
  nowMs: number = Date.now(),
  storage: Pick<Storage, 'getItem'> | null =
    typeof window !== 'undefined' ? window.localStorage : null
): boolean {
  if (!uid || !storage) return false;
  const raw = storage.getItem(getUpgradeBannerStorageKey(uid));
  if (!raw) return true;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return true;
  const cooldownMs = PLAN_CONFIG.bannerTutupHari * MS_PER_DAY;
  return nowMs - dismissedAt >= cooldownMs;
}

export function dismissUpgradeBanner(
  uid: string,
  nowMs: number = Date.now(),
  storage: Pick<Storage, 'setItem'> | null =
    typeof window !== 'undefined' ? window.localStorage : null
): void {
  if (!uid || !storage) return;
  storage.setItem(getUpgradeBannerStorageKey(uid), String(nowMs));
}

/**
 * Representasi aman pengguna di panel /admin (dilarang memuat judulSkripsi, nama dosen, atau catatan).
 */
export interface SafeAdminUserRow {
  uid: string;
  namaLengkap: string;
  email: string;
  universitas: string;
  prodi: string;
  plan: UserPlan;
  premiumUntil: string | null;
  sumberPremium: SumberPremium;
  createdAtIso: string | null;
}

export type AdminPaketFilter = 'semua' | 'free' | 'premium_aktif' | 'premium_berakhir';

export function filterAdminUsers(
  rows: readonly SafeAdminUserRow[],
  kataKunci: string,
  filterPaket: AdminPaketFilter,
  now: Date = new Date()
): SafeAdminUserRow[] {
  const q = kataKunci.trim().toLowerCase();

  return rows.filter((row) => {
    const status = resolveEffectivePlan(
      {
        plan: row.plan,
        premiumUntil: row.premiumUntil,
        sumberPremium: row.sumberPremium,
      },
      now
    );

    if (filterPaket === 'free' && row.plan !== 'free') return false;
    if (filterPaket === 'premium_aktif' && status.effectivePlan !== 'premium') return false;
    if (filterPaket === 'premium_berakhir' && !(row.plan === 'premium' && status.isExpired)) {
      return false;
    }

    if (!q) return true;
    const haystack = [row.namaLengkap, row.email, row.universitas, row.prodi]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
