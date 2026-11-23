import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useRoadmap } from '../contexts/RoadmapContext';
import { ID_TEXT } from '../i18n/id';
import { formatTanggalSingkat } from '../lib/date';
import { hitungProgresSkripsi, hitungStatusTahap } from '../lib/skripsiLogic';
import { ROADMAP_LIMITS, type RoadmapTugas } from '../types/roadmap';

export function RoadmapPage() {
  const {
    tahapList,
    tugasList,
    loading,
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
  } = useRoadmap();

  // Form tambah tugas (dibuka lewat tombol "+ Tambah" di header atau tombol di tahap)
  const [formTambahTerbuka, setFormTambahTerbuka] = useState(false);
  const [tahapTerpilih, setTahapTerpilih] = useState('');
  const [judulBaru, setJudulBaru] = useState('');
  const [tenggatBaru, setTenggatBaru] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingTambah, setSavingTambah] = useState(false);

  // Edit tugas inline
  const [editingTugasId, setEditingTugasId] = useState<string | null>(null);
  const [editJudul, setEditJudul] = useState('');
  const [editTenggat, setEditTenggat] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Konfirmasi hapus & Undo toast
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoTugas, setUndoTugas] = useState<RoadmapTugas | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Panel tahap tersembunyi & tawaran template baru
  const [lihatTersembunyi, setLihatTersembunyi] = useState(false);
  const [menerapkanTemplate, setMenerapkanTemplate] = useState(false);
  const [aksiError, setAksiError] = useState<string | null>(null);

  const visibleTahapList = useMemo(
    () => tahapList.filter((t) => !t.tersembunyi),
    [tahapList]
  );
  const hiddenTahapList = useMemo(
    () => tahapList.filter((t) => t.tersembunyi),
    [tahapList]
  );

  const tugasByTahap = useMemo(() => {
    const map = new Map<string, RoadmapTugas[]>();
    for (const tugas of tugasList) {
      const arr = map.get(tugas.tahapId) || [];
      arr.push(tugas);
      map.set(tugas.tahapId, arr);
    }
    return map;
  }, [tugasList]);

  const progres = useMemo(
    () => hitungProgresSkripsi(tahapList, tugasList),
    [tahapList, tugasList]
  );

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  function bukaFormTambah(tahapIdDefault?: string) {
    const defaultId = tahapIdDefault || visibleTahapList[0]?.tahapId || tahapList[0]?.tahapId || '';
    setTahapTerpilih(defaultId);
    setJudulBaru('');
    setTenggatBaru('');
    setFormError(null);
    setFormTambahTerbuka(true);
  }

  async function handleSimpanTambah(e: React.FormEvent) {
    e.preventDefault();
    const judulTrim = judulBaru.trim();
    if (!judulTrim) {
      setFormError(ID_TEXT.roadmap.formTambah.validasiJudulWajib);
      return;
    }
    if (judulTrim.length > ROADMAP_LIMITS.judulTugas) {
      setFormError(ID_TEXT.roadmap.formTambah.validasiJudulPanjang);
      return;
    }
    if (tugasList.length >= ROADMAP_LIMITS.maxItems) {
      setFormError(ID_TEXT.roadmap.formTambah.validasiBatasMaks);
      return;
    }
    if (!tahapTerpilih) return;

    setFormError(null);
    setSavingTambah(true);
    try {
      await tambahTugas({
        tahapId: tahapTerpilih,
        judul: judulTrim,
        tenggat: tenggatBaru,
      });
      setFormTambahTerbuka(false);
      setJudulBaru('');
      setTenggatBaru('');
    } catch {
      setFormError(ID_TEXT.roadmap.errorSimpan);
    } finally {
      setSavingTambah(false);
    }
  }

  function mulaiEdit(tugas: RoadmapTugas) {
    setEditingTugasId(tugas.tugasId);
    setEditJudul(tugas.judul);
    setEditTenggat(tugas.tenggat);
    setEditError(null);
    setConfirmDeleteId(null);
  }

  async function handleSimpanEdit(e: React.FormEvent, tugasId: string) {
    e.preventDefault();
    const judulTrim = editJudul.trim();
    if (!judulTrim) {
      setEditError(ID_TEXT.roadmap.formTambah.validasiJudulWajib);
      return;
    }
    if (judulTrim.length > ROADMAP_LIMITS.judulTugas) {
      setEditError(ID_TEXT.roadmap.formTambah.validasiJudulPanjang);
      return;
    }

    setEditError(null);
    setSavingEdit(true);
    try {
      await ubahTugas(tugasId, { judul: judulTrim, tenggat: editTenggat });
      setEditingTugasId(null);
    } catch {
      setEditError(ID_TEXT.roadmap.errorSimpan);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleHapusTugas(tugas: RoadmapTugas) {
    setAksiError(null);
    try {
      await hapusTugas(tugas);
      setConfirmDeleteId(null);
      setUndoTugas(tugas);
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = window.setTimeout(() => {
        setUndoTugas(null);
      }, 6500);
    } catch {
      setAksiError(ID_TEXT.roadmap.errorSimpan);
    }
  }

  async function handleUndoHapus() {
    if (!undoTugas) return;
    const target = undoTugas;
    setUndoTugas(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    try {
      await batalkanHapusTugas(target);
    } catch {
      setAksiError(ID_TEXT.roadmap.errorSimpan);
    }
  }

  async function handleToggleSelesai(tugas: RoadmapTugas) {
    setAksiError(null);
    try {
      await toggleSelesaiTugas(tugas.tugasId, !tugas.selesai);
    } catch {
      setAksiError(ID_TEXT.roadmap.errorSimpan);
    }
  }

  async function handleToggleSembunyikan(tahapId: string, tersembunyi: boolean) {
    setAksiError(null);
    try {
      await toggleSembunyikanTahap(tahapId, tersembunyi);
    } catch {
      setAksiError(ID_TEXT.roadmap.errorSimpan);
    }
  }

  async function handleTerapkanTemplateBaru() {
    if (!templateBaruTersedia) return;
    setMenerapkanTemplate(true);
    setAksiError(null);
    try {
      await terapkanTemplateBaru(templateBaruTersedia);
    } catch {
      setAksiError(ID_TEXT.roadmap.errorSimpan);
    } finally {
      setMenerapkanTemplate(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={ID_TEXT.app.memuat}>
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-48 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-11 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
        <div className="h-24 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        <div className="h-52 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        <div className="h-52 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman + Tombol "+ Tambah" (tanpa FAB) */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            {ID_TEXT.roadmap.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {ID_TEXT.roadmap.catatanKampus}
          </p>
        </div>

        <button
          type="button"
          onClick={() => bukaFormTambah()}
          disabled={tahapList.length === 0}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ID_TEXT.roadmap.tombolTambahJudul}</span>
        </button>
      </header>

      {(error || aksiError) && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{aksiError || ID_TEXT.roadmap.errorMuat}</span>
        </div>
      )}

      {/* Tawaran Template Baru jika Jenis Penelitian diubah di Profil */}
      {templateBaruTersedia && (
        <section className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {ID_TEXT.roadmap.tawaranTemplateJudul(templateBaruTersedia)}
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {ID_TEXT.roadmap.tawaranTemplateDeskripsi}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={menerapkanTemplate}
              onClick={() => void handleTerapkanTemplateBaru()}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-indigo-300 bg-white hover:bg-indigo-50 text-[#4F46E5] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {menerapkanTemplate && (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              )}
              <span>
                {menerapkanTemplate
                  ? ID_TEXT.roadmap.tawaranTemplateMemuat
                  : ID_TEXT.roadmap.tawaranTemplateTerima}
              </span>
            </button>
            <button
              type="button"
              onClick={() => abaikanTemplateBaru(templateBaruTersedia)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/70 transition-colors whitespace-nowrap"
            >
              {ID_TEXT.roadmap.tawaranTemplateAbaikan}
            </button>
          </div>
        </section>
      )}

      {/* Ringkasan Progres & Tombol Tahap Tersembunyi */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-semibold text-[#0F172A] tabular-nums">
            {ID_TEXT.roadmap.progresRingkas(progres.persen, progres.selesai, progres.total)}
          </p>

          {hiddenTahapList.length > 0 && (
            <button
              type="button"
              onClick={() => setLihatTersembunyi((prev) => !prev)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {lihatTersembunyi
                  ? ID_TEXT.roadmap.tombolSembunyikanPanelTersembunyi
                  : ID_TEXT.roadmap.tombolTampilkanTersembunyi(hiddenTahapList.length)}
              </span>
            </button>
          )}
        </div>

        {progres.persen !== null && (
          <div
            className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progres.persen}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progres.persen === 100 ? 'bg-[#10B981]' : 'bg-[#4F46E5]'
              }`}
              style={{ width: `${progres.persen}%` }}
            />
          </div>
        )}

        {/* Daftar Tahap Tersembunyi */}
        {lihatTersembunyi && hiddenTahapList.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {hiddenTahapList.map((tahap) => (
              <div
                key={tahap.tahapId}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-slate-50"
              >
                <span className="text-base text-slate-700 truncate">{tahap.judul}</span>
                <button
                  type="button"
                  onClick={() => void handleToggleSembunyikan(tahap.tahapId, false)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl text-sm font-semibold text-[#4F46E5] hover:bg-indigo-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {ID_TEXT.roadmap.tampilkanTahap}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form Tambah Tugas (muncul saat tombol Tambah diklik) */}
      {formTambahTerbuka && (
        <form
          onSubmit={handleSimpanTambah}
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.roadmap.formTambah.judulModal}
            </h2>
            <button
              type="button"
              onClick={() => setFormTambahTerbuka(false)}
              aria-label={ID_TEXT.app.tutup}
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tambah-tahap"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.roadmap.formTambah.pilihTahapLabel}
              </label>
              <select
                id="tambah-tahap"
                value={tahapTerpilih}
                onChange={(e) => setTahapTerpilih(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              >
                {tahapList.map((t) => (
                  <option key={t.tahapId} value={t.tahapId}>
                    {t.judul}
                    {t.tersembunyi ? ' (Tersembunyi)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tambah-tenggat"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.roadmap.formTambah.tenggatLabel}
              </label>
              <input
                id="tambah-tenggat"
                type="date"
                value={tenggatBaru}
                onChange={(e) => setTenggatBaru(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tambah-judul" className="block text-sm font-semibold text-[#0F172A]">
              {ID_TEXT.roadmap.formTambah.namaTugasLabel}
            </label>
            <input
              id="tambah-judul"
              type="text"
              maxLength={ROADMAP_LIMITS.judulTugas}
              value={judulBaru}
              onChange={(e) => {
                setJudulBaru(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={ID_TEXT.roadmap.formTambah.namaTugasPlaceholder}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
            />
            {formError && (
              <p className="text-sm text-rose-700" role="alert">
                {formError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFormTambahTerbuka(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base transition-colors"
            >
              {ID_TEXT.roadmap.formTambah.tombolBatal}
            </button>
            <button
              type="submit"
              disabled={savingTambah}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {savingTambah && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>
                {savingTambah
                  ? ID_TEXT.roadmap.formTambah.tombolMenyimpan
                  : ID_TEXT.roadmap.formTambah.tombolSimpan}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Timeline Vertikal Tahap */}
      {visibleTahapList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {ID_TEXT.roadmap.semuaTersembunyiJudul}
          </h2>
          <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            {ID_TEXT.roadmap.semuaTersembunyiDeskripsi}
          </p>
          {hiddenTahapList.length > 0 && (
            <button
              type="button"
              onClick={() => setLihatTersembunyi(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
            >
              {ID_TEXT.roadmap.tombolTampilkanTersembunyi(hiddenTahapList.length)}
            </button>
          )}
        </div>
      ) : (
        <ol className="relative space-y-6">
          {visibleTahapList.map((tahap, index) => {
            const daftarTugas = tugasByTahap.get(tahap.tahapId) || [];
            const status = hitungStatusTahap(daftarTugas);
            const jumlahSelesai = daftarTugas.filter((t) => t.selesai).length;
            const isLast = index === visibleTahapList.length - 1;

            return (
              <li key={tahap.tahapId} className="relative pl-9 sm:pl-11">
                {/* Garis Timeline Vertikal */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[13px] sm:left-[15px] top-9 bottom-[-24px] w-0.5 bg-slate-200"
                  />
                )}

                {/* Ikon Node Timeline */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center"
                >
                  {status === 'selesai' ? (
                    <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                  ) : status === 'sedang_berjalan' ? (
                    <CircleDot className="w-6 h-6 text-[#4F46E5]" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </span>

                {/* Kartu Tahap */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="text-lg font-bold text-[#0F172A]">{tahap.judul}</h2>
                        <span
                          className={`text-sm font-medium ${
                            status === 'selesai'
                              ? 'text-emerald-700'
                              : status === 'sedang_berjalan'
                                ? 'text-[#4F46E5]'
                                : 'text-slate-500'
                          }`}
                        >
                          <span aria-hidden="true">· </span>
                          {ID_TEXT.roadmap.statusLabel[status]}
                        </span>
                        <span className="text-sm text-slate-500 tabular-nums">
                          <span aria-hidden="true">· </span>
                          {ID_TEXT.roadmap.jumlahTugasTahap(jumlahSelesai, daftarTugas.length)}
                        </span>
                      </div>
                      {tahap.deskripsi && (
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                          {tahap.deskripsi}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => bukaFormTambah(tahap.tahapId)}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{ID_TEXT.roadmap.tambahTugasDiTahap}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleToggleSembunyikan(tahap.tahapId, true)}
                        aria-label={`${ID_TEXT.roadmap.sembunyikanTahap} ${tahap.judul}`}
                        title={ID_TEXT.roadmap.sembunyikanTahap}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <EyeOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline">
                          {ID_TEXT.roadmap.sembunyikanTahap}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Daftar Tugas dalam Tahap */}
                  {daftarTugas.length === 0 ? (
                    <p className="text-base text-slate-500 py-2">
                      {ID_TEXT.roadmap.tahapKosongTugas}
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {daftarTugas.map((tugas) => {
                        const isEditing = editingTugasId === tugas.tugasId;
                        const isConfirmDelete = confirmDeleteId === tugas.tugasId;

                        if (isEditing) {
                          return (
                            <li key={tugas.tugasId} className="py-3">
                              <form
                                onSubmit={(e) => void handleSimpanEdit(e, tugas.tugasId)}
                                className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200"
                              >
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`edit-judul-${tugas.tugasId}`}
                                    className="block text-sm font-semibold text-[#0F172A]"
                                  >
                                    {ID_TEXT.roadmap.formTambah.namaTugasLabel}
                                  </label>
                                  <input
                                    id={`edit-judul-${tugas.tugasId}`}
                                    type="text"
                                    maxLength={ROADMAP_LIMITS.judulTugas}
                                    value={editJudul}
                                    onChange={(e) => {
                                      setEditJudul(e.target.value);
                                      if (editError) setEditError(null);
                                    }}
                                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                                  />
                                  {editError && (
                                    <p className="text-sm text-rose-700" role="alert">
                                      {editError}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                                  <div className="space-y-1.5">
                                    <label
                                      htmlFor={`edit-tenggat-${tugas.tugasId}`}
                                      className="block text-sm font-semibold text-[#0F172A]"
                                    >
                                      {ID_TEXT.roadmap.formTambah.tenggatLabel}
                                    </label>
                                    <input
                                      id={`edit-tenggat-${tugas.tugasId}`}
                                      type="date"
                                      value={editTenggat}
                                      onChange={(e) => setEditTenggat(e.target.value)}
                                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 tabular-nums"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTugasId(null)}
                                      className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium"
                                    >
                                      {ID_TEXT.roadmap.editTugas.tombolBatal}
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={savingEdit}
                                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-70"
                                    >
                                      {savingEdit && (
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                      )}
                                      <span>{ID_TEXT.roadmap.editTugas.tombolSimpan}</span>
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </li>
                          );
                        }

                        return (
                          <li key={tugas.tugasId} className="py-2 first:pt-1 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => void handleToggleSelesai(tugas)}
                                aria-pressed={tugas.selesai}
                                className="flex-1 min-h-[44px] py-1.5 pr-2 text-left flex items-start gap-3 rounded-xl hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                    tugas.selesai
                                      ? 'bg-[#10B981] border-[#10B981] text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {tugas.selesai && <Check className="w-4 h-4" strokeWidth={2.5} />}
                                </span>

                                <div className="min-w-0 space-y-0.5">
                                  <span
                                    className={`block text-base leading-snug ${
                                      tugas.selesai
                                        ? 'line-through text-slate-400'
                                        : 'text-[#0F172A]'
                                    }`}
                                  >
                                    {tugas.judul}
                                  </span>
                                  {tugas.tenggat && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>{formatTanggalSingkat(tugas.tenggat)}</span>
                                    </span>
                                  )}
                                </div>
                              </button>

                              {/* Aksi Edit & Hapus */}
                              {isConfirmDelete ? (
                                <div className="flex items-center gap-1.5 shrink-0 py-1">
                                  <span className="text-xs text-slate-600 hidden sm:inline">
                                    {ID_TEXT.roadmap.hapusTugas.konfirmasiTanya}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleHapusTugas(tugas)}
                                    className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium whitespace-nowrap"
                                  >
                                    {ID_TEXT.roadmap.hapusTugas.konfirmasiYa}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium whitespace-nowrap"
                                  >
                                    {ID_TEXT.roadmap.hapusTugas.konfirmasiBatal}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => mulaiEdit(tugas)}
                                    aria-label={`${ID_TEXT.roadmap.editTugas.tombolUbah}: ${tugas.judul}`}
                                    className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 flex items-center justify-center transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDeleteId(tugas.tugasId);
                                      setEditingTugasId(null);
                                    }}
                                    aria-label={`${ID_TEXT.roadmap.hapusTugas.tombolHapus}: ${tugas.judul}`}
                                    className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Undo Toast saat Tugas Dihapus */}
      {undoTugas && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F172A] text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-sm leading-snug truncate">
            {ID_TEXT.roadmap.hapusTugas.undoPesan(undoTugas.judul)}
          </p>
          <button
            type="button"
            onClick={() => void handleUndoHapus()}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ID_TEXT.roadmap.hapusTugas.undoTombol}</span>
          </button>
        </div>
      )}
    </div>
  );
}
