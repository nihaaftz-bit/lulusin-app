import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { PLAN_CONFIG } from '../config/plans';
import {
  buildSafeThesisContext,
  calculateRemainingQuota,
  canSendWithCooldown,
  getExcessMessageIdsToPrune,
  mapGeminiErrorToIndonesian,
  validateAiInput,
  type AiQuotaStatus,
} from '../lib/aiLogic';
import { getLocalIsoDateKey } from '../lib/date';
import {
  db,
  handleFirestoreError,
  isPermissionDeniedError,
  OperationType,
} from '../lib/firebase';
import { generateThesisAssistantReply } from '../lib/geminiAi';
import type {
  AiChatMessage,
  AiChatMode,
  AiUsageRecord,
  SafeThesisContext,
} from '../types/ai';
import { useAuth } from './AuthContext';
import { useRoadmap } from './RoadmapContext';

export interface ConversationSummary {
  percakapanId: string;
  mode: AiChatMode;
  preview: string;
  updatedAtIso: string;
  messageCount: number;
}

interface AiAssistantContextValue {
  allMessages: AiChatMessage[];
  activeMessages: AiChatMessage[];
  activePercakapanId: string;
  conversations: ConversationSummary[];
  safeContext: SafeThesisContext;
  quotaStatus: AiQuotaStatus;
  loading: boolean;
  sending: boolean;
  cooldownSeconds: number;
  sendError: string | null;
  clearSendError: () => void;
  mulaiPercakapanBaru: () => void;
  pilihPercakapan: (percakapanId: string) => void;
  kirimPesanAi: (params: {
    mode: AiChatMode;
    rawText: string;
    babLabel?: string;
    storageLabelText?: string;
  }) => Promise<boolean>;
}

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

function makeConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, planStatus } = useAuth();
  const { tahapList, tugasList } = useRoadmap();

  const [rawMessages, setRawMessages] = useState<AiChatMessage[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [todayUsageCount, setTodayUsageCount] = useState(0);
  const [todayDateKey, setTodayDateKey] = useState(() => getLocalIsoDateKey());

  const [activePercakapanId, setActivePercakapanId] = useState<string>(() => makeConversationId());
  const [hasInitializedActiveConv, setHasInitializedActiveConv] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSentAtMs, setLastSentAtMs] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const uid = firebaseUser?.uid ?? null;
  const onboardingSelesai = Boolean(profile?.onboardingSelesai);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentKey = getLocalIsoDateKey();
      setTodayDateKey((prev) => (prev === currentKey ? prev : currentKey));
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastSentAtMs) {
      setCooldownSeconds(0);
      return;
    }

    const updateCooldown = () => {
      const check = canSendWithCooldown(lastSentAtMs, Date.now());
      setCooldownSeconds(check.remainingSeconds);
    };

    updateCooldown();
    const timer = window.setInterval(updateCooldown, 250);
    return () => window.clearInterval(timer);
  }, [lastSentAtMs]);

  useEffect(() => {
    if (!uid || !onboardingSelesai) {
      setRawMessages([]);
      setChatsLoaded(false);
      setHasInitializedActiveConv(false);
      return;
    }

    const chatsCol = collection(db, 'users', uid, 'aiChats');
    const qChats = query(
      chatsCol,
      where('uid', '==', uid),
      limit(PLAN_CONFIG.aiLimits.riwayatMaksPesan)
    );

    const unsub = onSnapshot(
      qChats,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data() as AiChatMessage);
        setRawMessages(docs);
        setChatsLoaded(true);
      },
      (err) => {
        setChatsLoaded(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/aiChats`);
        }
      }
    );

    return () => unsub();
  }, [uid, onboardingSelesai]);

  useEffect(() => {
    if (!uid || !onboardingSelesai) {
      setTodayUsageCount(0);
      setUsageLoaded(false);
      return;
    }

    const usagePath = `users/${uid}/aiUsage/${todayDateKey}`;
    const usageRef = doc(db, 'users', uid, 'aiUsage', todayDateKey);

    const unsub = onSnapshot(
      usageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AiUsageRecord;
          setTodayUsageCount(typeof data.count === 'number' ? data.count : 0);
        } else {
          setTodayUsageCount(0);
        }
        setUsageLoaded(true);
      },
      (err) => {
        setUsageLoaded(true);
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.GET, usagePath);
        }
      }
    );

    return () => unsub();
  }, [uid, onboardingSelesai, todayDateKey]);

  const allMessages = useMemo(() => {
    return [...rawMessages].sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
  }, [rawMessages]);

  useEffect(() => {
    if (!chatsLoaded || hasInitializedActiveConv) return;
    if (allMessages.length > 0) {
      const latest = allMessages[allMessages.length - 1];
      setActivePercakapanId(latest.percakapanId);
    }
    setHasInitializedActiveConv(true);
  }, [chatsLoaded, hasInitializedActiveConv, allMessages]);

  const activeMessages = useMemo(
    () => allMessages.filter((m) => m.percakapanId === activePercakapanId),
    [allMessages, activePercakapanId]
  );

  const conversations = useMemo<ConversationSummary[]>(() => {
    const grouped = new Map<string, AiChatMessage[]>();
    for (const msg of allMessages) {
      const arr = grouped.get(msg.percakapanId) ?? [];
      arr.push(msg);
      grouped.set(msg.percakapanId, arr);
    }
    const list: ConversationSummary[] = [];
    for (const [percakapanId, msgs] of grouped.entries()) {
      const firstUser = msgs.find((m) => m.role === 'user') ?? msgs[0];
      const latest = msgs[msgs.length - 1];
      list.push({
        percakapanId,
        mode: latest.mode,
        preview: firstUser.teks.slice(0, 72),
        updatedAtIso: latest.createdAtIso,
        messageCount: msgs.length,
      });
    }
    return list.sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
  }, [allMessages]);

  const safeContext = useMemo(
    () => buildSafeThesisContext(profile, tahapList, tugasList),
    [profile, tahapList, tugasList]
  );

  const quotaStatus = useMemo(
    () => calculateRemainingQuota(todayUsageCount, planStatus.effectivePlan),
    [todayUsageCount, planStatus.effectivePlan]
  );

  function mulaiPercakapanBaru() {
    setActivePercakapanId(makeConversationId());
    setHasInitializedActiveConv(true);
    setSendError(null);
  }

  function pilihPercakapan(percakapanId: string) {
    setActivePercakapanId(percakapanId);
    setHasInitializedActiveConv(true);
    setSendError(null);
  }

  async function kirimPesanAi(params: {
    mode: AiChatMode;
    rawText: string;
    babLabel?: string;
    storageLabelText?: string;
  }): Promise<boolean> {
    if (!uid || !profile) return false;
    if (sending) return false;

    if (
      (params.mode === 'simulasi_sidang' || params.mode === 'analisis_bab') &&
      planStatus.effectivePlan !== 'premium'
    ) {
      setSendError('Fitur ini khusus pengguna Lulusin Premium.');
      return false;
    }

    const cooldownCheck = canSendWithCooldown(lastSentAtMs, Date.now());
    if (!cooldownCheck.allowed) {
      setSendError(
        `Tunggu sebentar ya (${cooldownCheck.remainingSeconds} detik lagi) sebelum mengirim pesan berikutnya.`
      );
      return false;
    }

    const validation = validateAiInput(params.mode, params.rawText);
    if (!validation.valid) {
      setSendError(validation.reason);
      return false;
    }

    const activeDateKey = getLocalIsoDateKey();
    if (activeDateKey !== todayDateKey) {
      setTodayDateKey(activeDateKey);
    }

    const usageRef = doc(db, 'users', uid, 'aiUsage', activeDateKey);
    let currentCount = todayUsageCount;
    try {
      const snap = await getDoc(usageRef);
      if (snap.exists()) {
        const data = snap.data() as AiUsageRecord;
        currentCount = typeof data.count === 'number' ? data.count : 0;
      } else {
        currentCount = 0;
      }
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}/aiUsage/${activeDateKey}`);
      }
      setSendError('Gagal memeriksa sisa kuota harianmu. Coba lagi sebentar ya.');
      return false;
    }

    const latestQuota = calculateRemainingQuota(currentCount, planStatus.effectivePlan);
    if (latestQuota.exhausted) {
      setSendError('Kuota pesan AI harianmu sudah habis.');
      return false;
    }

    setSendError(null);
    setSending(true);
    setLastSentAtMs(Date.now());

    const convId = activePercakapanId;
    const modeHistory = allMessages.filter(
      (m) => m.percakapanId === convId && m.mode === params.mode
    );

    let replyText = '';
    try {
      replyText = await generateThesisAssistantReply({
        mode: params.mode,
        context: safeContext,
        historyMessages: modeHistory,
        userText: validation.trimmed,
        babLabel: params.babLabel,
      });
    } catch (err) {
      setSending(false);
      const rawDetail = err instanceof Error ? err.message : String(err);
      setSendError(`${mapGeminiErrorToIndonesian(err)} (${rawDetail})`);
      return false;
    }

    try {
      await runTransaction(db, async (tx) => {
        const usageSnap = await tx.get(usageRef);
        const existingCount = usageSnap.exists()
          ? Number((usageSnap.data() as AiUsageRecord).count ?? 0)
          : 0;

        if (existingCount >= latestQuota.limit) {
          throw new Error('QUOTA_EXCEEDED');
        }

        if (!usageSnap.exists()) {
          tx.set(usageRef, {
            uid,
            dateKey: activeDateKey,
            count: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.update(usageRef, {
            count: existingCount + 1,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (err) {
      setSending(false);
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/aiUsage/${activeDateKey}`);
      }
      if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
        setSendError('Kuota pesan AI harianmu sudah mencapai batas.');
      } else {
        setSendError('Gagal mencatat pemakaian kuota harianmu. Coba lagi sebentar ya.');
      }
      return false;
    }

    try {
      const batch = writeBatch(db);
      const excessIds = getExcessMessageIdsToPrune(
        allMessages,
        2,
        PLAN_CONFIG.aiLimits.riwayatMaksPesan
      );
      for (const oldId of excessIds) {
        batch.delete(doc(db, 'users', uid, 'aiChats', oldId));
      }

      const nowMs = Date.now();
      const userIso = new Date(nowMs).toISOString();
      const assistantIso = new Date(nowMs + 1).toISOString();

      const userDocRef = doc(collection(db, 'users', uid, 'aiChats'));
      const assistantDocRef = doc(collection(db, 'users', uid, 'aiChats'));

      const storedUserText = (params.storageLabelText || validation.trimmed).slice(
        0,
        PLAN_CONFIG.aiLimits.pesanSimpanMaxKarakter
      );
      const storedReplyText = replyText.slice(0, PLAN_CONFIG.aiLimits.pesanSimpanMaxKarakter);

      batch.set(userDocRef, {
        uid,
        pesanId: userDocRef.id,
        percakapanId: convId,
        mode: params.mode,
        role: 'user',
        teks: storedUserText,
        createdAtIso: userIso,
        createdAt: serverTimestamp(),
      });

      batch.set(assistantDocRef, {
        uid,
        pesanId: assistantDocRef.id,
        percakapanId: convId,
        mode: params.mode,
        role: 'assistant',
        teks: storedReplyText,
        createdAtIso: assistantIso,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setSending(false);
      return true;
    } catch (err) {
      setSending(false);
      if (isPermissionDeniedError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/aiChats`);
      }
      setSendError('Jawaban diterima, namun gagal menyimpan riwayat chat ke database.');
      return false;
    }
  }

  return (
    <AiAssistantContext.Provider
      value={{
        allMessages,
        activeMessages,
        activePercakapanId,
        conversations,
        safeContext,
        quotaStatus,
        loading: !chatsLoaded || !usageLoaded,
        sending,
        cooldownSeconds,
        sendError,
        clearSendError: () => setSendError(null),
        mulaiPercakapanBaru,
        pilihPercakapan,
        kirimPesanAi,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error('useAiAssistant harus dipakai di dalam AiAssistantProvider.');
  }
  return ctx;
}
