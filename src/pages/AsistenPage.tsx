import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Crown,
  GraduationCap,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PremiumGate } from '../components/PremiumGate';
import { PLAN_CONFIG } from '../config/plans';
import { useAiAssistant } from '../contexts/AiAssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { AI_DISCLAIMER_TEXT, getMaxCharactersForMode } from '../lib/aiLogic';
import { formatWaktuIndonesia } from '../lib/date';
import {
  AI_QUICK_SUGGESTIONS,
  ANALISIS_BAB_OPTIONS,
  SIMULASI_SIDANG_TOPICS,
  type AiChatMode,
} from '../types/ai';

const MODE_LABELS: Record<AiChatMode, string> = {
  chat: ID_TEXT.asisten.tabChat,
  simulasi_sidang: ID_TEXT.asisten.tabSimulasi,
  analisis_bab: ID_TEXT.asisten.tabAnalisis,
};

export function AsistenPage() {
  const { planStatus } = useAuth();
  const {
    activeMessages,
    activePercakapanId,
    conversations,
    safeContext,
    quotaStatus,
    loading,
    sending,
    cooldownSeconds,
    sendError,
    clearSendError,
    mulaiPercakapanBaru,
    pilihPercakapan,
    kirimPesanAi,
  } = useAiAssistant();

  const [activeMode, setActiveMode] = useState<AiChatMode>('chat');
  const [chatInput, setChatInput] = useState('');
  const [babPilihan, setBabPilihan] = useState<string>(ANALISIS_BAB_OPTIONS[0]);
  const [drafInput, setDrafInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const isPremium = planStatus.effectivePlan === 'premium';
  const maxChatChars = getMaxCharactersForMode('chat');
  const maxAnalisisChars = getMaxCharactersForMode('analisis_bab');

  // Jika paket Premium habis saat berada di tab Premium, kembalikan ke tab chat reguler
  useEffect(() => {
    if (!isPremium && activeMode !== 'chat') {
      setActiveMode('chat');
    }
  }, [isPremium, activeMode]);

  const visibleMessages = useMemo(
    () => activeMessages.filter((m) => m.mode === activeMode),
    [activeMessages, activeMode]
  );

  useEffect(() => {
    if (visibleMessages.length > 0 && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [visibleMessages.length, activeMode]);

  const isSubmitBlocked =
    sending || cooldownSeconds > 0 || quotaStatus.exhausted;

  async function handleKirimChat(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitBlocked) return;
    const ok = await kirimPesanAi({
      mode: activeMode === 'simulasi_sidang' ? 'simulasi_sidang' : 'chat',
      rawText: chatInput,
    });
    if (ok) {
      setChatInput('');
    }
  }

  async function handleKirimPreset(mode: 'chat' | 'simulasi_sidang', promptText: string) {
    if (isSubmitBlocked) return;
    await kirimPesanAi({
      mode,
      rawText: promptText,
    });
  }

  async function handleKirimAnalisisBab(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitBlocked) return;
    const storageSummary = `[Analisis ${babPilihan}] (${drafInput.trim().length.toLocaleString('id-ID')} karakter)\n\n${drafInput.trim()}`;
    const ok = await kirimPesanAi({
      mode: 'analisis_bab',
      rawText: drafInput,
      babLabel: babPilihan,
      storageLabelText: storageSummary,
    });
    if (ok) {
      setDrafInput('');
    }
  }

  function handleGantiPercakapan(percakapanId: string, mode: AiChatMode) {
    pilihPercakapan(percakapanId);
    if (mode === 'chat' || isPremium) {
      setActiveMode(mode);
    } else {
      setActiveMode('chat');
    }
    setHistoryOpen(false);
  }

  const quotaPct =
    quotaStatus.limit > 0
      ? Math.min(100, Math.round((quotaStatus.remaining / quotaStatus.limit) * 100))
      : 0;

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={ID_TEXT.app.memuat}>
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-5 w-96 max-w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-24 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header Halaman + Kuota + Percakapan Baru */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {ID_TEXT.asisten.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            {ID_TEXT.asisten.subjudul}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Indikator Sisa Kuota Harian */}
          <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-xs min-w-[190px]">
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
              <span>Kuota harian</span>
              <span className="tabular-nums font-semibold text-[#0F172A]">
                {quotaStatus.teksSisaKuota}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
              aria-hidden="true"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  quotaStatus.exhausted
                    ? 'bg-amber-500'
                    : quotaPct <= 20
                      ? 'bg-amber-500'
                      : 'bg-[#4F46E5]'
                }`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen((prev) => !prev)}
              aria-expanded={historyOpen}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              <History className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>
                {ID_TEXT.asisten.labelRiwayatTersimpan} ({conversations.length})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              mulaiPercakapanBaru();
              setHistoryOpen(false);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.asisten.tombolPercakapanBaru}</span>
          </button>
        </div>
      </header>

      {/* Panel Riwayat Tersimpan (maks 50 pesan terakhir) */}
      {historyOpen && conversations.length > 0 && (
        <section
          aria-label={ID_TEXT.asisten.labelRiwayatTersimpan}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#0F172A]">
              Riwayat percakapan tersimpan (maks. {PLAN_CONFIG.aiLimits.riwayatMaksPesan} pesan terakhir)
            </p>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-[#0F172A] px-2 py-1 rounded-lg"
            >
              {ID_TEXT.app.tutup}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {conversations.map((conv) => {
              const isCurrent = conv.percakapanId === activePercakapanId;
              return (
                <button
                  key={conv.percakapanId}
                  type="button"
                  onClick={() => handleGantiPercakapan(conv.percakapanId, conv.mode)}
                  className={`text-left rounded-xl border px-3.5 py-2.5 transition-colors ${
                    isCurrent
                      ? 'border-[#4F46E5] bg-indigo-50/60'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-0.5">
                    <span className="font-semibold text-[#4F46E5]">{MODE_LABELS[conv.mode]}</span>
                    <span className="tabular-nums">{conv.messageCount} pesan</span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A] truncate">{conv.preview}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatWaktuIndonesia(conv.updatedAtIso)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Transparansi Konteks Non-PII */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5 min-w-0">
            <p className="text-slate-700">
              <span className="font-semibold text-[#0F172A]">
                {ID_TEXT.asisten.privasiRingkasLabel}
              </span>{' '}
              <span className="break-words">
                Judul “{safeContext.judulSkripsi}” · {safeContext.jenisPenelitian} · Tahap{' '}
                {safeContext.tahapAktif}
              </span>
            </p>
            <p className="text-xs text-slate-500">{ID_TEXT.asisten.privasiRingkasDetail}</p>
          </div>
        </div>
      </div>

      {/* Peringatan Saat Kuota Harian Habis */}
      {quotaStatus.exhausted && (
        <div
          role="status"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-amber-950">
                {ID_TEXT.asisten.kuotaHabisJudul}
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                {isPremium ? ID_TEXT.asisten.kuotaHabisPremium : ID_TEXT.asisten.kuotaHabisGratis}
              </p>
            </div>
          </div>

          {!isPremium && (
            <Link
              to="/premium"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap transition-colors"
            >
              <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.asisten.tombolUpgradeKuota}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {/* Tab Pilihan Mode Asisten */}
      <div
        role="tablist"
        aria-label="Mode Asisten AI"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'chat'}
          onClick={() => {
            clearSendError();
            setActiveMode('chat');
          }}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
            activeMode === 'chat'
              ? 'bg-[#4F46E5] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ID_TEXT.asisten.tabChat}</span>
        </button>

        <PremiumGate
          feature="simulasi_sidang"
          onAuthorized={() => {
            clearSendError();
            setActiveMode('simulasi_sidang');
          }}
        >
          {({ handleClick }) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'simulasi_sidang'}
              onClick={handleClick}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                activeMode === 'simulasi_sidang'
                  ? 'bg-[#4F46E5] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Crown
                className={`w-4 h-4 shrink-0 ${
                  activeMode === 'simulasi_sidang' ? 'text-amber-200' : 'text-amber-600'
                }`}
                aria-hidden="true"
              />
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.asisten.tabSimulasi}</span>
            </button>
          )}
        </PremiumGate>

        <PremiumGate
          feature="analisis_alur_bab"
          onAuthorized={() => {
            clearSendError();
            setActiveMode('analisis_bab');
          }}
        >
          {({ handleClick }) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'analisis_bab'}
              onClick={handleClick}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                activeMode === 'analisis_bab'
                  ? 'bg-[#4F46E5] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Crown
                className={`w-4 h-4 shrink-0 ${
                  activeMode === 'analisis_bab' ? 'text-amber-200' : 'text-amber-600'
                }`}
                aria-hidden="true"
              />
              <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.asisten.tabAnalisis}</span>
            </button>
          )}
        </PremiumGate>
      </div>

      {/* Area Utama Percakapan / Mode */}
      <section
        aria-label={MODE_LABELS[activeMode]}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
      >
        {/* Area Pesan */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[520px] min-h-[260px] overflow-y-auto bg-[#F8FAFC]/60">
          {visibleMessages.length === 0 ? (
            <div className="py-6 text-center max-w-xl mx-auto space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  {activeMode === 'simulasi_sidang'
                    ? ID_TEXT.asisten.simulasiIntroJudul
                    : activeMode === 'analisis_bab'
                      ? PLAN_CONFIG.fiturGerbang.analisis_alur_bab.judul
                      : ID_TEXT.asisten.emptyChatJudul}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {activeMode === 'simulasi_sidang'
                    ? ID_TEXT.asisten.simulasiIntroDeskripsi
                    : activeMode === 'analisis_bab'
                      ? ID_TEXT.asisten.analisisCatatan
                      : ID_TEXT.asisten.emptyChatDeskripsi}
                </p>
              </div>

              {activeMode === 'simulasi_sidang' && (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {SIMULASI_SIDANG_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      disabled={isSubmitBlocked}
                      onClick={() => void handleKirimPreset('simulasi_sidang', topic.prompt)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-sm font-semibold text-[#4F46E5] transition-colors disabled:opacity-50"
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.pesanId}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-[#4F46E5] text-white rounded-br-md'
                        : 'bg-white border border-slate-200/90 text-[#0F172A] rounded-bl-md shadow-xs'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-semibold mb-1 ${
                        isUser ? 'text-indigo-100' : 'text-[#4F46E5]'
                      }`}
                    >
                      {isUser
                        ? 'Kamu'
                        : activeMode === 'simulasi_sidang'
                          ? 'Penguji Simulasi Sidang'
                          : 'Pendamping Skripsi'}
                    </div>
                    {msg.teks}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white border border-slate-200/90 px-4 py-3 text-sm text-slate-600 inline-flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5]" aria-hidden="true" />
                <span>{ID_TEXT.asisten.tombolMengirim}</span>
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Error Pengiriman */}
        {sendError && (
          <div
            role="alert"
            className="mx-4 sm:mx-6 mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex items-start gap-2.5 text-sm text-amber-900"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{sendError}</span>
          </div>
        )}

        {/* Form Input Berdasarkan Mode */}
        {activeMode === 'analisis_bab' ? (
          <form
            onSubmit={(e) => void handleKirimAnalisisBab(e)}
            className="p-4 sm:p-6 border-t border-slate-100 space-y-4 bg-white"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="asisten-bab-select"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.asisten.analisisLabelBab}
                </label>
                <select
                  id="asisten-bab-select"
                  value={babPilihan}
                  onChange={(e) => setBabPilihan(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm sm:text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {ANALISIS_BAB_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="asisten-draf-input"
                  className="text-sm font-medium text-[#0F172A]"
                >
                  {ID_TEXT.asisten.analisisLabelDraf}
                </label>
                <span className="text-xs tabular-nums text-slate-500">
                  {drafInput.length.toLocaleString('id-ID')} /{' '}
                  {maxAnalisisChars.toLocaleString('id-ID')} karakter
                </span>
              </div>
              <textarea
                id="asisten-draf-input"
                rows={7}
                maxLength={maxAnalisisChars}
                value={drafInput}
                onChange={(e) => setDrafInput(e.target.value)}
                placeholder={ID_TEXT.asisten.analisisPlaceholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-600">{ID_TEXT.asisten.disclaimer}</p>
              <button
                type="submit"
                disabled={isSubmitBlocked || !drafInput.trim()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {sending
                    ? ID_TEXT.asisten.tombolMengirim
                    : cooldownSeconds > 0
                      ? ID_TEXT.asisten.tombolJeda(cooldownSeconds)
                      : ID_TEXT.asisten.analisisTombol}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => void handleKirimChat(e)}
            className="p-4 sm:p-6 border-t border-slate-100 space-y-3 bg-white"
          >
            {/* Saran Cepat (untuk Chat Reguler) */}
            {activeMode === 'chat' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500">
                  {ID_TEXT.asisten.saranCepatLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AI_QUICK_SUGGESTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isSubmitBlocked}
                      onClick={() => void handleKirimPreset('chat', item.prompt)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#4F46E5] text-xs sm:text-sm font-medium text-slate-700 transition-colors disabled:opacity-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topik Simulasi Sidang jika sudah mulai */}
            {activeMode === 'simulasi_sidang' && visibleMessages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {SIMULASI_SIDANG_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    disabled={isSubmitBlocked}
                    onClick={() => void handleKirimPreset('simulasi_sidang', topic.prompt)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-xs font-semibold text-[#4F46E5] transition-colors disabled:opacity-50"
                  >
                    + {topic.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-end gap-2">
                <textarea
                  aria-label="Pesan untuk Asisten AI"
                  rows={3}
                  maxLength={maxChatChars}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isSubmitBlocked && chatInput.trim()) {
                        void handleKirimChat(e);
                      }
                    }
                  }}
                  placeholder={
                    activeMode === 'simulasi_sidang'
                      ? ID_TEXT.asisten.placeholderSimulasi
                      : ID_TEXT.asisten.placeholderChat
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={isSubmitBlocked || !chatInput.trim()}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50 transition-colors shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {sending
                      ? ID_TEXT.asisten.tombolMengirim
                      : cooldownSeconds > 0
                        ? ID_TEXT.asisten.tombolJeda(cooldownSeconds)
                        : ID_TEXT.asisten.tombolKirim}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600">
                <p>{ID_TEXT.asisten.disclaimer}</p>
                <span className="tabular-nums text-slate-500">
                  {chatInput.length.toLocaleString('id-ID')} /{' '}
                  {maxChatChars.toLocaleString('id-ID')} karakter
                </span>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
