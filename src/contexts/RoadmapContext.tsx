import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { ambilTemplateRoadmap } from '../data/roadmapTemplates';
import {
  db,
  handleFirestoreError,
  isPermissionDeniedError,
  OperationType,
} from '../lib/firebase';
import { ROADMAP_LIMITS, type RoadmapTahap, type RoadmapTugas } from '../types/roadmap';
import type { JenisPenelitian } from '../types/user';
import { useAuth } from './AuthContext';

interface RoadmapContextValue {
  tahapList: RoadmapTahap[];
  tugasList: RoadmapTugas[];
  loading: boolean;
  error: boolean;
  templateBaruTersedia: JenisPenelitian | null;
  toggleSelesaiTugas: (tugasId: string, selesai: boolean) => Promise<void>;
  tambahTugas: (input: { tahapId: string; judul: string; tenggat: string }) => Promise<string>;
  ubahTugas: (tugasId: string, input: { judul: string; tenggat: string }) => Promise<void>;
  hapusTugas: (tugas: RoadmapTugas) => Promise<void>;
  batalkanHapusTugas: (tugas: RoadmapTugas) => Promise<void>;
  toggleSembunyikanTahap: (tahapId: string, tersembunyi: boolean) => Promise<void>;
  terapkanTemplateBaru: (jenis: JenisPenelitian) => Promise<void>;
  abaikanTemplateBaru: (jenis: JenisPenelitian) => void;
}

const RoadmapContext = createContext<RoadmapContextValue | null>(null);

const BATCH_CHUNK_SIZE = 8;

function sanitizeText(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

interface PendingWrite {
  ref: DocumentReference;
  type: 'set' | 'update';
  data: Record<string, unknown>;
}

async function commitChunked(writes: PendingWrite[]): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_CHUNK_SIZE) {
    const chunk = writes.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else {
        batch.update(op.ref, op.data);
      }
    }
    await batch.commit();
  }
}

export function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile } = useAuth();
  const [tahapRaw, setTahapRaw] = useState<RoadmapTahap[]>([]);
  const [tugasRaw, setTugasRaw] = useState<RoadmapTugas[]>([]);
  const [tahapLoaded, setTahapLoaded] = useState(false);
  const [tugasLoaded, setTugasLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [dismissedTemplateKey, setDismissedTemplateKey] = useState<string>('');
  const seededUidRef = useRef<string | null>(null);

  const uid = firebaseUser?.uid ?? null;
  const onboardingSelesai = Boolean(profile?.onboardingSelesai);
  const jenisPenelitian = profile?.jenisPenelitian ?? '';

  useEffect(() => {
    if (!uid || !onboardingSelesai) {
      setTahapRaw([]);
      setTugasRaw([]);
      setTahapLoaded(false);
      setTugasLoaded(false);
      seededUidRef.current = null;
      return;
    }

    const savedDismissed =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(`lulusin_template_dismiss_${uid}`) || ''
        : '';
    setDismissedTemplateKey(savedDismissed);

    const tahapColRef = collection(db, 'users', uid, 'roadmapTahap');
    const tugasColRef = collection(db, 'users', uid, 'roadmapTugas');

    const qTahap = query(tahapColRef, where('uid', '==', uid), limit(ROADMAP_LIMITS.maxItems));
    const qTugas = query(tugasColRef, where('uid', '==', uid), limit(ROADMAP_LIMITS.maxItems));

    const unsubTahap = onSnapshot(
      qTahap,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as RoadmapTahap);
        setTahapRaw(items);
        setTahapLoaded(true);
        setError(false);

        if (snapshot.empty && seededUidRef.current !== uid) {
          seededUidRef.current = uid;
          void seedInitialRoadmap(uid, jenisPenelitian);
        }
      },
      (err) => {
        setTahapLoaded(true);
        setError(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/roadmapTahap`);
        }
      }
    );

    const unsubTugas = onSnapshot(
      qTugas,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as RoadmapTugas);
        setTugasRaw(items);
        setTugasLoaded(true);
        setError(false);
      },
      (err) => {
        setTugasLoaded(true);
        setError(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/roadmapTugas`);
        }
      }
    );

    return () => {
      unsubTahap();
      unsubTugas();
    };
  }, [uid, onboardingSelesai]);

  async function seedInitialRoadmap(userId: string, jenis: JenisPenelitian | '') {
    const template = ambilTemplateRoadmap(jenis);
    const sumberTemplate: JenisPenelitian = jenis || 'Belum tahu';
    const tahapWrites: PendingWrite[] = [];
    const tugasWrites: PendingWrite[] = [];
    let globalTaskOrder = 0;

    template.forEach((tahapSeed, tahapIdx) => {
      const tahapId = `tahap_${tahapIdx + 1}`;
      const tahapRef = doc(db, 'users', userId, 'roadmapTahap', tahapId);
      const tahapDoc: RoadmapTahap = {
        uid: userId,
        tahapId,
        judul: sanitizeText(tahapSeed.judul, ROADMAP_LIMITS.judulTahap),
        deskripsi: sanitizeText(tahapSeed.deskripsi, ROADMAP_LIMITS.deskripsiTahap),
        urutan: tahapIdx,
        tersembunyi: false,
        sumberTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      tahapWrites.push({
        ref: tahapRef,
        type: 'set',
        data: tahapDoc as unknown as Record<string, unknown>,
      });

      tahapSeed.tugas.forEach((judulTugas, taskIdx) => {
        const tugasId = `tugas_${tahapIdx + 1}_${taskIdx + 1}`;
        const tugasRef = doc(db, 'users', userId, 'roadmapTugas', tugasId);
        const tugasDoc: RoadmapTugas = {
          uid: userId,
          tugasId,
          tahapId,
          judul: sanitizeText(judulTugas, ROADMAP_LIMITS.judulTugas),
          selesai: false,
          tenggat: '',
          urutan: globalTaskOrder++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        tugasWrites.push({
          ref: tugasRef,
          type: 'set',
          data: tugasDoc as unknown as Record<string, unknown>,
        });
      });
    });

    try {
      // Komit tahap terlebih dahulu agar seluruh parent tahap sudah ada sebelum tugas ditulis,
      // sekaligus menjaga jumlah evaluasi exists() di bawah batas 20 per batch Firestore.
      await commitChunked(tahapWrites);
      await commitChunked(tugasWrites);
    } catch (err) {
      seededUidRef.current = null;
      setError(true);
      console.error('Gagal menyiapkan template Roadmap awal:', err);
    }
  }

  const tahapList = useMemo(
    () => [...tahapRaw].sort((a, b) => a.urutan - b.urutan),
    [tahapRaw]
  );

  const tugasList = useMemo(
    () => [...tugasRaw].sort((a, b) => a.urutan - b.urutan),
    [tugasRaw]
  );

  const templateBaruTersedia = useMemo<JenisPenelitian | null>(() => {
    if (!tahapLoaded || tahapList.length === 0 || !jenisPenelitian) return null;
    const sudahSesuai = tahapList.some((t) => t.sumberTemplate === jenisPenelitian);
    if (sudahSesuai) return null;
    if (dismissedTemplateKey === jenisPenelitian) return null;
    return jenisPenelitian;
  }, [tahapLoaded, tahapList, jenisPenelitian, dismissedTemplateKey]);

  async function toggleSelesaiTugas(tugasId: string, selesai: boolean): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/roadmapTugas/${tugasId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'roadmapTugas', tugasId), {
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

  async function tambahTugas(input: {
    tahapId: string;
    judul: string;
    tenggat: string;
  }): Promise<string> {
    if (!uid) return '';
    if (tugasList.length >= ROADMAP_LIMITS.maxItems) {
      throw new Error('BATAS_MAKS_TUGAS');
    }

    const tugasRef = doc(collection(db, 'users', uid, 'roadmapTugas'));
    const maxUrutan = tugasList.reduce((acc, item) => Math.max(acc, item.urutan), -1);
    const payload: RoadmapTugas = {
      uid,
      tugasId: tugasRef.id,
      tahapId: input.tahapId,
      judul: sanitizeText(input.judul, ROADMAP_LIMITS.judulTugas),
      selesai: false,
      tenggat: sanitizeText(input.tenggat, ROADMAP_LIMITS.tenggat),
      urutan: maxUrutan + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const path = `users/${uid}/roadmapTugas/${tugasRef.id}`;
    try {
      await setDoc(tugasRef, payload);
      return tugasRef.id;
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  async function ubahTugas(
    tugasId: string,
    input: { judul: string; tenggat: string }
  ): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/roadmapTugas/${tugasId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'roadmapTugas', tugasId), {
        judul: sanitizeText(input.judul, ROADMAP_LIMITS.judulTugas),
        tenggat: sanitizeText(input.tenggat, ROADMAP_LIMITS.tenggat),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function hapusTugas(tugas: RoadmapTugas): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/roadmapTugas/${tugas.tugasId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'roadmapTugas', tugas.tugasId));
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      throw err;
    }
  }

  async function batalkanHapusTugas(tugas: RoadmapTugas): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/roadmapTugas/${tugas.tugasId}`;
    const payload: RoadmapTugas = {
      uid,
      tugasId: tugas.tugasId,
      tahapId: tugas.tahapId,
      judul: sanitizeText(tugas.judul, ROADMAP_LIMITS.judulTugas),
      selesai: tugas.selesai,
      tenggat: sanitizeText(tugas.tenggat, ROADMAP_LIMITS.tenggat),
      urutan: tugas.urutan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', uid, 'roadmapTugas', tugas.tugasId), payload);
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  async function toggleSembunyikanTahap(tahapId: string, tersembunyi: boolean): Promise<void> {
    if (!uid) return;
    const path = `users/${uid}/roadmapTahap/${tahapId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'roadmapTahap', tahapId), {
        tersembunyi,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      throw err;
    }
  }

  async function terapkanTemplateBaru(jenis: JenisPenelitian): Promise<void> {
    if (!uid) return;
    const template = ambilTemplateRoadmap(jenis);
    const tahapWrites: PendingWrite[] = [];
    const tugasWrites: PendingWrite[] = [];

    const existingTahapByTitle = new Map<string, RoadmapTahap>();
    for (const t of tahapList) {
      existingTahapByTitle.set(t.judul.trim().toLowerCase(), t);
    }
    const existingTaskTitles = new Set(
      tugasList.map((t) => `${t.tahapId}::${t.judul.trim().toLowerCase()}`)
    );

    let nextTahapOrder = tahapList.reduce((acc, t) => Math.max(acc, t.urutan), -1) + 1;
    let nextTugasOrder = tugasList.reduce((acc, t) => Math.max(acc, t.urutan), -1) + 1;
    let currentTotalTugas = tugasList.length;
    let currentTotalTahap = tahapList.length;

    for (const tahapSeed of template) {
      const keyTitle = tahapSeed.judul.trim().toLowerCase();
      const matchedTahap = existingTahapByTitle.get(keyTitle);
      let targetTahapId: string;

      if (matchedTahap) {
        targetTahapId = matchedTahap.tahapId;
        tahapWrites.push({
          ref: doc(db, 'users', uid, 'roadmapTahap', targetTahapId),
          type: 'update',
          data: {
            sumberTemplate: jenis,
            updatedAt: serverTimestamp(),
          },
        });
      } else {
        if (currentTotalTahap >= ROADMAP_LIMITS.maxItems) continue;
        const tahapRef = doc(collection(db, 'users', uid, 'roadmapTahap'));
        targetTahapId = tahapRef.id;
        currentTotalTahap += 1;
        tahapWrites.push({
          ref: tahapRef,
          type: 'set',
          data: {
            uid,
            tahapId: targetTahapId,
            judul: sanitizeText(tahapSeed.judul, ROADMAP_LIMITS.judulTahap),
            deskripsi: sanitizeText(tahapSeed.deskripsi, ROADMAP_LIMITS.deskripsiTahap),
            urutan: nextTahapOrder++,
            tersembunyi: false,
            sumberTemplate: jenis,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        });
      }

      for (const judulTugas of tahapSeed.tugas) {
        if (currentTotalTugas >= ROADMAP_LIMITS.maxItems) break;
        const normalizedKey = `${targetTahapId}::${judulTugas.trim().toLowerCase()}`;
        if (existingTaskTitles.has(normalizedKey)) continue;

        const tugasRef = doc(collection(db, 'users', uid, 'roadmapTugas'));
        currentTotalTugas += 1;
        existingTaskTitles.add(normalizedKey);
        tugasWrites.push({
          ref: tugasRef,
          type: 'set',
          data: {
            uid,
            tugasId: tugasRef.id,
            tahapId: targetTahapId,
            judul: sanitizeText(judulTugas, ROADMAP_LIMITS.judulTugas),
            selesai: false,
            tenggat: '',
            urutan: nextTugasOrder++,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        });
      }
    }

    try {
      await commitChunked(tahapWrites);
      await commitChunked(tugasWrites);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`lulusin_template_dismiss_${uid}`);
      }
      setDismissedTemplateKey('');
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/roadmapTahap`);
      }
      throw err;
    }
  }

  function abaikanTemplateBaru(jenis: JenisPenelitian) {
    if (uid && typeof window !== 'undefined') {
      window.localStorage.setItem(`lulusin_template_dismiss_${uid}`, jenis);
    }
    setDismissedTemplateKey(jenis);
  }

  return (
    <RoadmapContext.Provider
      value={{
        tahapList,
        tugasList,
        loading: !tahapLoaded || !tugasLoaded,
        error,
        templateBaruTersedia,
        toggleSelesaiTugas,
        tambahTugas,
        ubahTugas,
        hapusTugas,
        batalkanHapusTugas,
        toggleSembunyikanTahap,
        terapkanTemplateBaru,
        abaikanTemplateBaru,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext);
  if (!ctx) {
    throw new Error('useRoadmap harus dipakai di dalam RoadmapProvider.');
  }
  return ctx;
}
