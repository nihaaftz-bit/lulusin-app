import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isPermissionDeniedError,
  OperationType,
} from './firebase';

export const FEEDBACK_KATEGORI_OPTIONS = [
  'Bug atau Error',
  'Saran Fitur',
  'Kendala Penggunaan',
  'Lainnya',
] as const;

export type FeedbackKategori = (typeof FEEDBACK_KATEGORI_OPTIONS)[number];

export const FEEDBACK_LIMITS = {
  pesan: 1500,
  halaman: 120,
} as const;

export interface ExportedUserData {
  dieksporPada: string;
  aplikasi: string;
  profil: Record<string, unknown> | null;
  roadmapTahap: Record<string, unknown>[];
  roadmapTugas: Record<string, unknown>[];
  bimbingan: Record<string, unknown>[];
  revisi: Record<string, unknown>[];
  referensi: Record<string, unknown>[];
  aiChats: Record<string, unknown>[];
  aiUsage: Record<string, unknown>[];
}

const USER_SUBCOLLECTIONS = [
  'roadmapTugas',
  'roadmapTahap',
  'bimbingan',
  'revisi',
  'referensi',
  'aiChats',
] as const;

export async function eksporSemuaDataPengguna(uid: string): Promise<ExportedUserData> {
  const userRef = doc(db, 'users', uid);
  let profil: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(userRef);
    profil = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
    throw err;
  }

  const allSubs = [...USER_SUBCOLLECTIONS, 'aiUsage'] as const;
  const results = await Promise.all(
    allSubs.map(async (sub) => {
      const path = `users/${uid}/${sub}`;
      try {
        const snap = await getDocs(query(collection(db, 'users', uid, sub), where('uid', '==', uid)));
        return snap.docs.map((d) => d.data() as Record<string, unknown>);
      } catch (err) {
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, path);
        }
        throw err;
      }
    })
  );

  return {
    dieksporPada: new Date().toISOString(),
    aplikasi: 'Lulusin',
    profil,
    roadmapTugas: results[0],
    roadmapTahap: results[1],
    bimbingan: results[2],
    revisi: results[3],
    referensi: results[4],
    aiChats: results[5],
    aiUsage: results[6],
  };
}

async function deleteDocRefsInChunks(refs: DocumentReference[]): Promise<void> {
  const CHUNK_SIZE = 350;
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = refs.slice(i, i + CHUNK_SIZE);
    for (const ref of slice) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

export async function hapusSemuaDataFirestorePengguna(uid: string): Promise<void> {
  const refsToDelete: DocumentReference[] = [];

  for (const sub of USER_SUBCOLLECTIONS) {
    const path = `users/${uid}/${sub}`;
    try {
      const snap = await getDocs(query(collection(db, 'users', uid, sub), where('uid', '==', uid)));
      for (const d of snap.docs) {
        refsToDelete.push(d.ref);
      }
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      throw err;
    }
  }

  // Ambil daftar dokumen aiUsage sebelum users/{uid} dihapus,
  // lalu hapus setelah dokumen induk users/{uid} dihapus agar selaras dengan aturan proteksi kuota.
  const aiUsageRefs: DocumentReference[] = [];
  try {
    const usageSnap = await getDocs(query(collection(db, 'users', uid, 'aiUsage'), where('uid', '==', uid)));
    for (const d of usageSnap.docs) {
      aiUsageRefs.push(d.ref);
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, `users/${uid}/aiUsage`);
    }
    throw err;
  }

  if (refsToDelete.length > 0) {
    try {
      await deleteDocRefsInChunks(refsToDelete);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/*`);
      }
      throw err;
    }
  }

  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
    throw err;
  }

  if (aiUsageRefs.length > 0) {
    try {
      await deleteDocRefsInChunks(aiUsageRefs);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/aiUsage`);
      }
      throw err;
    }
  }
}

export async function kirimMasukanPenguji(
  uid: string,
  input: {
    kategori: FeedbackKategori;
    pesan: string;
    halaman: string;
  }
): Promise<void> {
  const docRef = doc(collection(db, 'feedback'));
  const payload = {
    uid,
    feedbackId: docRef.id,
    kategori: input.kategori,
    pesan: input.pesan.trim().slice(0, FEEDBACK_LIMITS.pesan),
    halaman: input.halaman.trim().slice(0, FEEDBACK_LIMITS.halaman),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `feedback/${docRef.id}`);
    }
    throw err;
  }
}
