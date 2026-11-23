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
  JURNAL_LIMITS,
  type JenisReferensi,
  type ReferensiRecord,
  type StatusBacaReferensi,
} from '../types/jurnal';
import { useAuth } from './AuthContext';

export interface ReferensiInput {
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
}

interface JurnalContextValue {
  referensiList: ReferensiRecord[];
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  muatLebihBanyak: () => void;
  tambahReferensi: (input: ReferensiInput) => Promise<void>;
  ubahReferensi: (referensiId: string, input: ReferensiInput) => Promise<void>;
  toggleStatusBaca: (referensiId: string, statusBaca: StatusBacaReferensi) => Promise<void>;
  hapusReferensi: (record: ReferensiRecord) => Promise<void>;
  batalkanHapusReferensi: (record: ReferensiRecord) => Promise<void>;
}

const JurnalContext = createContext<JurnalContextValue | null>(null);

function sanitizeText(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function sanitizeArray(items: string[], maxItems: number, maxItemLen: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of items) {
    const clean = raw.trim().slice(0, maxItemLen);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function JurnalProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile } = useAuth();
  const [rawList, setRawList] = useState<ReferensiRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [queryLimit, setQueryLimit] = useState<number>(JURNAL_LIMITS.pageSize);

  const uid = firebaseUser?.uid ?? null;
  const onboardingSelesai = Boolean(profile?.onboardingSelesai);

  useEffect(() => {
    if (!uid || !onboardingSelesai) {
      setRawList([]);
      setLoaded(false);
      setQueryLimit(JURNAL_LIMITS.pageSize);
      return;
    }

    const colRef = collection(db, 'users', uid, 'referensi');
    const qRef = query(colRef, where('uid', '==', uid), limit(queryLimit));

    const unsub = onSnapshot(
      qRef,
      (snapshot) => {
        setRawList(snapshot.docs.map((d) => d.data() as ReferensiRecord));
        setLoaded(true);
        setError(false);
      },
      (err) => {
        setLoaded(true);
        setError(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/referensi`);
        }
      }
    );

    return () => unsub();
  }, [uid, onboardingSelesai, queryLimit]);

  const referensiList = useMemo(() => {
    return [...rawList].sort((a, b) => {
      if (a.statusBaca !== b.statusBaca) {
        return a.statusBaca === 'Belum dibaca' ? -1 : 1;
      }
      const yearCmp = b.tahun.localeCompare(a.tahun);
      if (yearCmp !== 0) return yearCmp;
      return a.judul.localeCompare(b.judul, 'id');
    });
  }, [rawList]);

  const hasMore = rawList.length >= queryLimit && queryLimit < JURNAL_LIMITS.maxItems;

  function muatLebihBanyak() {
    setQueryLimit((prev) => Math.min(prev + JURNAL_LIMITS.pageSize, JURNAL_LIMITS.maxItems));
  }

  async function tambahReferensi(input: ReferensiInput): Promise<void> {
    if (!uid) return;
    if (referensiList.length >= JURNAL_LIMITS.maxItems) {
      throw new Error('BATAS_MAKS_REFERENSI');
    }

    const docRef = doc(collection(db, 'users', uid, 'referensi'));
    const payload: ReferensiRecord = {
      uid,
      referensiId: docRef.id,
      judul: sanitizeText(input.judul, JURNAL_LIMITS.judul),
      penulis: sanitizeArray(input.penulis, JURNAL_LIMITS.penulisMax, JURNAL_LIMITS.penulisItem),
      tahun: sanitizeText(input.tahun, JURNAL_LIMITS.tahun),
      jenis: input.jenis,
      namaSumber: sanitizeText(input.namaSumber, JURNAL_LIMITS.namaSumber),
      volumeInfo: sanitizeText(input.volumeInfo, JURNAL_LIMITS.volumeInfo),
      tautan: sanitizeText(input.tautan, JURNAL_LIMITS.tautan),
      doi: sanitizeText(input.doi, JURNAL_LIMITS.doi),
      catatan: sanitizeText(input.catatan, JURNAL_LIMITS.catatan),
      tag: sanitizeArray(input.tag, JURNAL_LIMITS.tagMax, JURNAL_LIMITS.tagItem),
      statusBaca: input.statusBaca,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/referensi/${docRef.id}`);
      }
      throw err;
    }
  }

  async function ubahReferensi(referensiId: string, input: ReferensiInput): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/referensi/${referensiId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'referensi', referensiId), {
        judul: sanitizeText(input.judul, JURNAL_LIMITS.judul),
        penulis: sanitizeArray(input.penulis, JURNAL_LIMITS.penulisMax, JURNAL_LIMITS.penulisItem),
        tahun: sanitizeText(input.tahun, JURNAL_LIMITS.tahun),
        jenis: input.jenis,
        namaSumber: sanitizeText(input.namaSumber, JURNAL_LIMITS.namaSumber),
        volumeInfo: sanitizeText(input.volumeInfo, JURNAL_LIMITS.volumeInfo),
        tautan: sanitizeText(input.tautan, JURNAL_LIMITS.tautan),
        doi: sanitizeText(input.doi, JURNAL_LIMITS.doi),
        catatan: sanitizeText(input.catatan, JURNAL_LIMITS.catatan),
        tag: sanitizeArray(input.tag, JURNAL_LIMITS.tagMax, JURNAL_LIMITS.tagItem),
        statusBaca: input.statusBaca,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function toggleStatusBaca(
    referensiId: string,
    statusBaca: StatusBacaReferensi
  ): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/referensi/${referensiId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'referensi', referensiId), {
        statusBaca,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function hapusReferensi(record: ReferensiRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/referensi/${record.referensiId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'referensi', record.referensiId));
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      throw err;
    }
  }

  async function batalkanHapusReferensi(record: ReferensiRecord): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/referensi/${record.referensiId}`;
    const payload: ReferensiRecord = {
      uid,
      referensiId: record.referensiId,
      judul: sanitizeText(record.judul, JURNAL_LIMITS.judul),
      penulis: sanitizeArray(record.penulis, JURNAL_LIMITS.penulisMax, JURNAL_LIMITS.penulisItem),
      tahun: sanitizeText(record.tahun, JURNAL_LIMITS.tahun),
      jenis: record.jenis,
      namaSumber: sanitizeText(record.namaSumber, JURNAL_LIMITS.namaSumber),
      volumeInfo: sanitizeText(record.volumeInfo, JURNAL_LIMITS.volumeInfo),
      tautan: sanitizeText(record.tautan, JURNAL_LIMITS.tautan),
      doi: sanitizeText(record.doi, JURNAL_LIMITS.doi),
      catatan: sanitizeText(record.catatan, JURNAL_LIMITS.catatan),
      tag: sanitizeArray(record.tag, JURNAL_LIMITS.tagMax, JURNAL_LIMITS.tagItem),
      statusBaca: record.statusBaca,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', uid, 'referensi', record.referensiId), payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  return (
    <JurnalContext.Provider
      value={{
        referensiList,
        loading: !loaded,
        error,
        hasMore,
        muatLebihBanyak,
        tambahReferensi,
        ubahReferensi,
        toggleStatusBaca,
        hapusReferensi,
        batalkanHapusReferensi,
      }}
    >
      {children}
    </JurnalContext.Provider>
  );
}

export function useJurnal() {
  const ctx = useContext(JurnalContext);
  if (!ctx) {
    throw new Error('useJurnal harus dipakai di dalam JurnalProvider.');
  }
  return ctx;
}
