import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { PLAN_CONFIG } from '../config/plans';
import {
  db,
  handleFirestoreError,
  isPermissionDeniedError,
  OperationType,
} from './firebase';
import { computePremiumUntilIso, type SafeAdminUserRow } from './planLogic';
import type { SumberPremium, UserPlan } from '../types/user';

export const ADMIN_USERS_LIMIT = 50;

function extractCreatedAtIso(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && 'toDate' in raw && typeof (raw as Timestamp).toDate === 'function') {
    try {
      return (raw as Timestamp).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Mengambil maksimal 50 pengguna untuk halaman /admin.
 * Memproyeksikan HANYA field non-sensitif; judulSkripsi, nama dosen, dan catatan tidak pernah disimpan ke state.
 */
export async function fetchAdminUsers(): Promise<SafeAdminUserRow[]> {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(ADMIN_USERS_LIMIT)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const plan: UserPlan = data.plan === 'premium' ? 'premium' : 'free';
      const premiumUntil = typeof data.premiumUntil === 'string' ? data.premiumUntil : null;
      const sumberRaw = data.sumberPremium;
      const sumberPremium: SumberPremium =
        sumberRaw === 'bayar' ||
        sumberRaw === 'manual' ||
        sumberRaw === 'promo' ||
        sumberRaw === 'trial'
          ? sumberRaw
          : null;

      return {
        uid: typeof data.uid === 'string' ? data.uid : d.id,
        namaLengkap: typeof data.namaLengkap === 'string' ? data.namaLengkap : '',
        email: typeof data.email === 'string' ? data.email : '',
        universitas: typeof data.universitas === 'string' ? data.universitas : '',
        prodi: typeof data.prodi === 'string' ? data.prodi : '',
        plan,
        premiumUntil,
        sumberPremium,
        createdAtIso: extractCreatedAtIso(data.createdAt),
      };
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
    throw err;
  }
}

export async function setPremium(
  uid: string,
  hari: number = PLAN_CONFIG.durasiPremiumHari,
  sumber: Exclude<SumberPremium, null> = 'manual'
): Promise<{ premiumUntil: string; sumberPremium: Exclude<SumberPremium, null> }> {
  const premiumUntil = computePremiumUntilIso(hari);
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      plan: 'premium',
      premiumUntil,
      sumberPremium: sumber,
      updatedAt: serverTimestamp(),
    });
    return { premiumUntil, sumberPremium: sumber };
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
    throw err;
  }
}

export async function cabutPremium(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      plan: 'free',
      premiumUntil: null,
      sumberPremium: null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
    throw err;
  }
}
