import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isPermissionDeniedError,
  OperationType,
} from '../lib/firebase';
import {
  BIMBINGAN_LIMITS,
  REVISI_LIMITS,
  type BimbinganRecord,
  type PrioritasRevisi,
  type RevisiRecord,
  type StatusRevisi,
  type SumberRevisiKategori,
  type TindakLanjutItem,
} from '../types/bimbinganRevisi';
import { useAuth } from './AuthContext';

interface BimbinganInput {
  tanggalIso: string;
  dosen: string;
  topik: string;
  ringkasan: string;
  tindakLanjut: TindakLanjutItem[];
  selesai: boolean;
}

interface RevisiInput {
  isi: string;
  sumberKategori: SumberRevisiKategori;
  sumberNama: string;
  prioritas: PrioritasRevisi;
  tenggat: string;
  status: StatusRevisi;
}

interface BimbinganRevisiContextValue {
  bimbinganList: BimbinganRecord[];
  revisiList: RevisiRecord[];
  loading: boolean;
  error: boolean;
  tambahBimbingan: (input: BimbinganInput) => Promise<void>;
  ubahBimbingan: (bimbinganId: string, input: BimbinganInput) => Promise<void>;
  toggleSelesaiBimbingan: (bimbinganId: string, selesai: boolean) => Promise<void>;
  updateTindakLanjutBimbingan: (
    bimbinganId: string,
    tindakLanjut: TindakLanjutItem[]
  ) => Promise<void>;
  hapusBimbingan: (record: BimbinganRecord) => Promise<void>;
  batalkanHapusBimbingan: (record: BimbinganRecord) => Promise<void>;
  tambahRevisi: (input: RevisiInput) => Promise<void>;
  ubahRevisi: (revisiId: string, input: RevisiInput) => Promise<void>;
  ubahStatusRevisi: (revisiId: string, status: StatusRevisi) => Promise<void>;
  hapusRevisi: (record: RevisiRecord) => Promise<void>;
  batalkanHapusRevisi: (record: RevisiRecord) => Promise<void>;
}

const BimbinganRevisiContext = createContext<BimbinganRevisiContextValue | null>(null);

function sanitizeText(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function sanitizeTindakLanjut(items: TindakLanjutItem[]): TindakLanjutItem[] {
  return items.slice(0, BIMBINGAN_LIMITS.tindakLanjutMax).map((item) => ({
    id: item.id.slice(0, 64),
    judul: sanitizeText(item.judul, BIMBINGAN_LIMITS.tindakLanjutJudul),
    selesai: Boolean(item.selesai),
    roadmapTugasId: (item.roadmapTugasId || '').slice(0, 128),
  }));
}

export function BimbinganRevisiProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile } = useAuth();
  const [bimbinganRaw, setBimbinganRaw] = useState<BimbinganRecord[]>([]);
  const [revisiRaw, setRevisiRaw] = useState<RevisiRecord[]>([]);
  const [bimbinganLoaded, setBimbinganLoaded] = useState(false);
  const [revisiLoaded, setRevisiLoaded] = useState(false);
  const [error, setError] = useState(false);

  const uid = firebaseUser?.uid ?? null;
  const onboardingSelesai = Boolean(profile?.onboardingSelesai);

  useEffect(() => {
    if (!uid || !onboardingSelesai) {
      setBimbinganRaw([]);
      setRevisiRaw([]);
      setBimbinganLoaded(false);
      setRevisiLoaded(false);
      return;
    }

    const bimbinganCol = collection(db, 'users', uid, 'bimbingan');
    const revisiCol = collection(db, 'users', uid, 'revisi');

    const qBimbingan = query(
      bimbinganCol,
      where('uid', '==', uid),
      limit(BIMBINGAN_LIMITS.maxItems)
    );
    const qRevisi = query(revisiCol, where('uid', '==', uid), limit(REVISI_LIMITS.maxItems));

    const unsubBimbingan = onSnapshot(
      qBimbingan,
      (snapshot) => {
        setBimbinganRaw(snapshot.docs.map((d) => d.data() as BimbinganRecord));
        setBimbinganLoaded(true);
        setError(false);
      },
      (err) => {
        setBimbinganLoaded(true);
        setError(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/bimbingan`);
        }
      }
    );

    const unsubRevisi = onSnapshot(
      qRevisi,
      (snapshot) => {
        setRevisiRaw(snapshot.docs.map((d) => d.data() as RevisiRecord));
        setRevisiLoaded(true);
        setError(false);
      },
      (err) => {
        setRevisiLoaded(true);
        setError(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/revisi`);
        }
      }
    );

    return () => {
      unsubBimbingan();
      unsubRevisi();
    };
  }, [uid, onboardingSelesai]);

  const bimbinganList = useMemo(
    () => [...bimbinganRaw].sort((a, b) => b.tanggalIso.localeCompare(a.tanggalIso)),
    [bimbinganRaw]
  );

  const revisiList = useMemo(() => {
    const priorityRank: Record<PrioritasRevisi, number> = {
      Tinggi: 0,
      Sedang: 1,
      Rendah: 2,
    };
    return [...revisiRaw].sort((a, b) => {
      const pDiff = priorityRank[a.prioritas] - priorityRank[b.prioritas];
      if (pDiff !== 0) return pDiff;
      if (a.tenggat && b.tenggat) return a.tenggat.localeCompare(b.tenggat);
      if (a.tenggat) return -1;
      if (b.tenggat) return 1;
      return a.isi.localeCompare(b.isi);
    });
  }, [revisiRaw]);

  async function tambahBimbingan(input: BimbinganInput): Promise<void> {
    if (!uid) return;
    if (bimbinganList.length >= BIMBINGAN_LIMITS.maxItems) {
      throw new Error('BATAS_MAKS_BIMBINGAN');
    }

    const docRef = doc(collection(db, 'users', uid, 'bimbingan'));
    const payload: BimbinganRecord = {
      uid,
      bimbinganId: docRef.id,
      tanggalIso: input.tanggalIso,
      dosen: sanitizeText(input.dosen, BIMBINGAN_LIMITS.dosen),
      topik: sanitizeText(input.topik, BIMBINGAN_LIMITS.topik),
      ringkasan: sanitizeText(input.ringkasan, BIMBINGAN_LIMITS.ringkasan),
      tindakLanjut: sanitizeTindakLanjut(input.tindakLanjut),
      selesai: Boolean(input.selesai),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/bimbingan/${docRef.id}`);
      }
      throw err;
    }
  }

  async function ubahBimbingan(bimbinganId: string, input: BimbinganInput): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/bimbingan/${bimbinganId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'bimbingan', bimbinganId), {
        tanggalIso: input.tanggalIso,
        dosen: sanitizeText(input.dosen, BIMBINGAN_LIMITS.dosen),
        topik: sanitizeText(input.topik, BIMBINGAN_LIMITS.topik),
        ringkasan: sanitizeText(input.ringkasan, BIMBINGAN_LIMITS.ringkasan),
        tindakLanjut: sanitizeTindakLanjut(input.tindakLanjut),
        selesai: Boolean(input.selesai),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function toggleSelesaiBimbingan(bimbinganId: string, selesai: boolean): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/bimbingan/${bimbinganId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'bimbingan', bimbinganId), {
        selesai,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function updateTindakLanjutBimbingan(
    bimbinganId: string,
    tindakLanjut: TindakLanjutItem[]
  ): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/bimbingan/${bimbinganId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'bimbingan', bimbinganId), {
        tindakLanjut: sanitizeTindakLanjut(tindakLanjut),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function hapusBimbingan(record: BimbinganRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/bimbingan/${record.bimbinganId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'bimbingan', record.bimbinganId));
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      throw err;
    }
  }

  async function batalkanHapusBimbingan(record: BimbinganRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/bimbingan/${record.bimbinganId}`;
    const payload: BimbinganRecord = {
      uid,
      bimbinganId: record.bimbinganId,
      tanggalIso: record.tanggalIso,
      dosen: sanitizeText(record.dosen, BIMBINGAN_LIMITS.dosen),
      topik: sanitizeText(record.topik, BIMBINGAN_LIMITS.topik),
      ringkasan: sanitizeText(record.ringkasan, BIMBINGAN_LIMITS.ringkasan),
      tindakLanjut: sanitizeTindakLanjut(record.tindakLanjut),
      selesai: record.selesai,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', uid, 'bimbingan', record.bimbinganId), payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  async function tambahRevisi(input: RevisiInput): Promise<void> {
    if (!uid) return;
    if (revisiList.length >= REVISI_LIMITS.maxItems) {
      throw new Error('BATAS_MAKS_REVISI');
    }

    const docRef = doc(collection(db, 'users', uid, 'revisi'));
    const payload: RevisiRecord = {
      uid,
      revisiId: docRef.id,
      isi: sanitizeText(input.isi, REVISI_LIMITS.isi),
      sumberKategori: input.sumberKategori,
      sumberNama: sanitizeText(input.sumberNama, REVISI_LIMITS.sumberNama),
      prioritas: input.prioritas,
      tenggat: sanitizeText(input.tenggat, REVISI_LIMITS.tenggat),
      status: input.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/revisi/${docRef.id}`);
      }
      throw err;
    }
  }

  async function ubahRevisi(revisiId: string, input: RevisiInput): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/revisi/${revisiId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'revisi', revisiId), {
        isi: sanitizeText(input.isi, REVISI_LIMITS.isi),
        sumberKategori: input.sumberKategori,
        sumberNama: sanitizeText(input.sumberNama, REVISI_LIMITS.sumberNama),
        prioritas: input.prioritas,
        tenggat: sanitizeText(input.tenggat, REVISI_LIMITS.tenggat),
        status: input.status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function ubahStatusRevisi(revisiId: string, status: StatusRevisi): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/revisi/${revisiId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'revisi', revisiId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function hapusRevisi(record: RevisiRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/revisi/${record.revisiId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'revisi', record.revisiId));
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      throw err;
    }
  }

  async function batalkanHapusRevisi(record: RevisiRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/revisi/${record.revisiId}`;
    const payload: RevisiRecord = {
      uid,
      revisiId: record.revisiId,
      isi: sanitizeText(record.isi, REVISI_LIMITS.isi),
      sumberKategori: record.sumberKategori,
      sumberNama: sanitizeText(record.sumberNama, REVISI_LIMITS.sumberNama),
      prioritas: record.prioritas,
      tenggat: sanitizeText(record.tenggat, REVISI_LIMITS.tenggat),
      status: record.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', uid, 'revisi', record.revisiId), payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  return (
    <BimbinganRevisiContext.Provider
      value={{
        bimbinganList,
        revisiList,
        loading: !bimbinganLoaded || !revisiLoaded,
        error,
        tambahBimbingan,
        ubahBimbingan,
        toggleSelesaiBimbingan,
        updateTindakLanjutBimbingan,
        hapusBimbingan,
        batalkanHapusBimbingan,
        tambahRevisi,
        ubahRevisi,
        ubahStatusRevisi,
        hapusRevisi,
        batalkanHapusRevisi,
      }}
    >
      {children}
    </BimbinganRevisiContext.Provider>
  );
}

export function useBimbinganRevisi() {
  const ctx = useContext(BimbinganRevisiContext);
  if (!ctx) {
    throw new Error('useBimbinganRevisi harus dipakai di dalam BimbinganRevisiProvider.');
  }
  return ctx;
}
