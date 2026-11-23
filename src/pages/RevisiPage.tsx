import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Flag,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { PremiumGate } from '../components/PremiumGate';
import { useAuth } from '../contexts/AuthContext';
import { useBimbinganRevisi } from '../contexts/BimbinganRevisiContext';
import { ID_TEXT } from '../i18n/id';
import { formatTanggalSingkat } from '../lib/date';
import { hitungRingkasanRevisi } from '../lib/skripsiLogic';
import {
  PRIORITAS_REVISI_OPTIONS,
  REVISI_LIMITS,
  STATUS_REVISI_OPTIONS,
  SUMBER_REVISI_OPTIONS,
  type PrioritasRevisi,
  type RevisiRecord,
  type StatusRevisi,
  type SumberRevisiKategori,
} from '../types/bimbinganRevisi';

export function RevisiPage() {
  const { profile } = useAuth();
  const {
    revisiList,
    loading,
    error,
    tambahRevisi,
    ubahRevisi,
    ubahStatusRevisi,
    hapusRevisi,
    batalkanHapusRevisi,
  } = useBimbinganRevisi();

  const dospem1 = profile?.dosenPembimbing1?.trim() || '';
  const dospem2 = profile?.dosenPembimbing2?.trim() || '';

  // Filter sumber & tab mobile
  const [filterSumber, setFilterSumber] = useState<'ALL' | SumberRevisiKategori>('ALL');
  const [tabMobile, setTabMobile] = useState<StatusRevisi>('Belum');

  // Form tambah / edit
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isi, setIsi] = useState('');
  const [sumberKategori, setSumberKategori] = useState<SumberRevisiKategori>('Pembimbing 1');
  const [sumberNama, setSumberNama] = useState('');
  const [prioritas, setPrioritas] = useState<PrioritasRevisi>('Sedang');
  const [tenggat, setTenggat] = useState('');
  const [status, setStatus] = useState<StatusRevisi>('Belum');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Hapus & Undo
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoRecord, setUndoRecord] = useState<RevisiRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [aksiPesan, setAksiPesan] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  function labelSumberKategori(kategori: SumberRevisiKategori): string {
    if (kategori === 'Pembimbing 1' && dospem1) return `Pembimbing 1 (${dospem1})`;
    if (kategori === 'Pembimbing 2' && dospem2) return `Pembimbing 2 (${dospem2})`;
    return kategori;
  }

  function defaultNamaUntukKategori(kategori: SumberRevisiKategori): string {
    if (kategori === 'Pembimbing 1') return dospem1;
    if (kategori === 'Pembimbing 2') return dospem2;
    return '';
  }

  function labelSumberKartu(record: RevisiRecord): string {
    const namaTersimpan = record.sumberNama.trim();
    if (namaTersimpan) {
      if (record.sumberKategori === 'Lainnya') return namaTersimpan;
      return `${record.sumberKategori} · ${namaTersimpan}`;
    }
    if (record.sumberKategori === 'Pembimbing 1' && dospem1) {
      return `Pembimbing 1 · ${dospem1}`;
    }
    if (record.sumberKategori === 'Pembimbing 2' && dospem2) {
      return `Pembimbing 2 · ${dospem2}`;
    }
    return record.sumberKategori;
  }

  const ringkasan = useMemo(() => hitungRingkasanRevisi(revisiList), [revisiList]);

  const revisiTersaring = useMemo(() => {
    if (filterSumber === 'ALL') return revisiList;
    return revisiList.filter((item) => item.sumberKategori === filterSumber);
  }, [revisiList, filterSumber]);

  const revisiPerStatus = useMemo(() => {
    const map: Record<StatusRevisi, RevisiRecord[]> = {
      Belum: [],
      Dikerjakan: [],
      Selesai: [],
    };
    for (const item of revisiTersaring) {
      map[item.status].push(item);
    }
    return map;
  }, [revisiTersaring]);

  function bukaFormTambah() {
    setEditingId(null);
    setIsi('');
    setSumberKategori('Pembimbing 1');
    setSumberNama(dospem1);
    setPrioritas('Sedang');
    setTenggat('');
    setStatus('Belum');
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function bukaFormEdit(record: RevisiRecord) {
    setEditingId(record.revisiId);
    setIsi(record.isi);
    setSumberKategori(record.sumberKategori);
    setSumberNama(record.sumberNama || defaultNamaUntukKategori(record.sumberKategori));
    setPrioritas(record.prioritas);
    setTenggat(record.tenggat);
    setStatus(record.status);
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function tutupForm() {
    setFormTerbuka(false);
    setEditingId(null);
    setFormError(null);
  }

  function handleUbahKategoriSumber(kategoriBaru: SumberRevisiKategori) {
    const namaLamaDefault = defaultNamaUntukKategori(sumberKategori);
    setSumberKategori(kategoriBaru);
    // Jika masih kosong atau masih berisi nilai otomatis kategori sebelumnya, perbarui dengan nama dari profil
    if (!sumberNama.trim() || sumberNama.trim() === namaLamaDefault) {
      setSumberNama(defaultNamaUntukKategori(kategoriBaru));
    }
  }

  async function handleSimpanForm(e: React.FormEvent) {
    e.preventDefault();
    const isiTrim = isi.trim();
    if (!isiTrim) {
      setFormError(ID_TEXT.revisi.validasi.isiWajib);
      return;
    }
    if (isiTrim.length > REVISI_LIMITS.isi) {
      setFormError(ID_TEXT.revisi.validasi.isiPanjang);
      return;
    }
    if (sumberNama.trim().length > REVISI_LIMITS.sumberNama) {
      setFormError(ID_TEXT.revisi.validasi.sumberNamaPanjang);
      return;
    }
    if (!editingId && revisiList.length >= REVISI_LIMITS.maxItems) {
      setFormError(ID_TEXT.revisi.validasi.batasMaks);
      return;
    }

    setFormError(null);
    setSavingForm(true);
    try {
      const payload = {
        isi: isiTrim,
        sumberKategori,
        sumberNama: sumberNama.trim(),
        prioritas,
        tenggat,
        status,
      };
      if (editingId) {
        await ubahRevisi(editingId, payload);
      } else {
        await tambahRevisi(payload);
      }
      tutupForm();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BATAS_MAKS_REVISI') {
        setFormError(ID_TEXT.revisi.validasi.batasMaks);
      } else {
        setFormError(ID_TEXT.revisi.errorSimpan);
      }
    } finally {
      setSavingForm(false);
    }
  }

  async function handleGantiStatus(record: RevisiRecord, statusBaru: StatusRevisi) {
    if (record.status === statusBaru) return;
    setAksiError(null);
    setUpdatingStatusId(record.revisiId);
    try {
      await ubahStatusRevisi(record.revisiId, statusBaru);
    } catch {
      setAksiError(ID_TEXT.revisi.errorSimpan);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleHapus(record: RevisiRecord) {
    setAksiError(null);
    try {
      await hapusRevisi(record);
      setConfirmDeleteId(null);
      if (editingId === record.revisiId) {
        tutupForm();
      }
      setUndoRecord(record);
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = window.setTimeout(() => {
        setUndoRecord(null);
      }, 6000);
    } catch {
      setAksiError(ID_TEXT.revisi.errorSimpan);
    }
  }

  async function handleUndoHapus() {
    if (!undoRecord) return;
    const recordToRestore = undoRecord;
    setUndoRecord(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    try {
      await batalkanHapusRevisi(recordToRestore);
    } catch {
      setAksiError(ID_TEXT.revisi.errorSimpan);
    }
  }

  async function handleSalinLaporanRevisi() {
    setAksiError(null);
    setAksiPesan(null);
    if (revisiList.length === 0) {
      setAksiPesan('Belum ada daftar revisi untuk disalin.');
      return;
    }

    const sections = STATUS_REVISI_OPTIONS.map((st) => {
      const items = revisiList.filter((r) => r.status === st);
      const lines =
        items.length > 0
          ? items
              .map(
                (r, idx) =>
                  `  ${idx + 1}. [${r.prioritas}] ${r.isi} (${labelSumberKartu(r)}${
                    r.tenggat ? `, tenggat ${formatTanggalSingkat(r.tenggat)}` : ''
                  })`
              )
              .join('\n')
          : '  - Tidak ada';
      return `${st} (${items.length}):\n${lines}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(sections);
      setAksiPesan('Ringkasan daftar revisi berhasil disalin ke clipboard.');
    } catch {
      setAksiError('Browser memblokir akses clipboard. Izinkan akses salin lalu coba lagi.');
    }
  }

  function prioritasColorClass(p: PrioritasRevisi): string {
    if (p === 'Tinggi') return 'text-rose-700';
    if (p === 'Sedang') return 'text-amber-700';
    return 'text-slate-600';
  }

  function renderRevisiCard(record: RevisiRecord) {
    const isConfirmDelete = confirmDeleteId === record.revisiId;
    const isUpdatingStatus = updatingStatusId === record.revisiId;

    return (
      <article
        key={record.revisiId}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3"
      >
        {/* Metadata tanpa pill */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-600">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${prioritasColorClass(
              record.prioritas
            )}`}
          >
            <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.revisi.prioritasTeks(record.prioritas)}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-700 font-medium">{labelSumberKartu(record)}</span>
          {record.tenggat && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.revisi.tenggatTeks(formatTanggalSingkat(record.tenggat))}</span>
              </span>
            </>
          )}
        </div>

        {/* Isi Revisi */}
        <p
          className={`text-base leading-relaxed whitespace-pre-line ${
            record.status === 'Selesai' ? 'text-slate-400 line-through' : 'text-[#0F172A]'
          }`}
        >
          {record.isi}
        </p>

        {/* Pindah Status + Edit/Hapus */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <label htmlFor={`status-${record.revisiId}`} className="sr-only">
              {ID_TEXT.revisi.aksi.pindahKe}
            </label>
            <select
              id={`status-${record.revisiId}`}
              disabled={isUpdatingStatus}
              value={record.status}
              onChange={(e) => void handleGantiStatus(record, e.target.value as StatusRevisi)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none disabled:opacity-60"
            >
              {STATUS_REVISI_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {ID_TEXT.revisi.statusOptions[opt]}
                </option>
              ))}
            </select>
          </div>

          {isConfirmDelete ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleHapus(record)}
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium whitespace-nowrap"
              >
                {ID_TEXT.revisi.aksi.konfirmasiYa}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium whitespace-nowrap"
              >
                {ID_TEXT.revisi.aksi.konfirmasiBatal}
              </button>
            </div>
          ) : (
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => bukaFormEdit(record)}
                aria-label={`${ID_TEXT.revisi.aksi.ubah}: ${record.isi}`}
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 flex items-center justify-center transition-colors"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(record.revisiId)}
                aria-label={`${ID_TEXT.revisi.aksi.hapus}: ${record.isi}`}
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={ID_TEXT.app.memuat}>
        <div className="space-y-2">
          <div className="h-8 w-52 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Halaman */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {ID_TEXT.revisi.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">{ID_TEXT.revisi.subjudul}</p>
          {revisiList.length > 0 && (
            <p className="text-base font-medium text-[#0F172A] pt-1 tabular-nums">
              {ringkasan.belumSelesai === 0
                ? ID_TEXT.revisi.ringkasanSelesaiSemua
                : ID_TEXT.revisi.ringkasan(
                    ringkasan.belumSelesai,
                    ringkasan.prioritasTinggiBelumSelesai
                  )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <PremiumGate
            feature="ekspor_revisi_laporan"
            label="Salin laporan"
            onAuthorized={() => void handleSalinLaporanRevisi()}
          />

          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.revisi.tombolTambahHeader.replace(/^\+\s*/, '')}</span>
          </button>
        </div>
      </header>

      {aksiPesan && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-sm sm:text-base text-emerald-900"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{aksiPesan}</span>
        </div>
      )}

      {(error || aksiError) && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm sm:text-base text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{aksiError || ID_TEXT.revisi.errorMuat}</span>
        </div>
      )}

      {/* Form Tambah / Ubah Revisi */}
      {formTerbuka && (
        <section
          aria-label={editingId ? ID_TEXT.revisi.form.judulEdit : ID_TEXT.revisi.form.judulTambah}
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {editingId ? ID_TEXT.revisi.form.judulEdit : ID_TEXT.revisi.form.judulTambah}
            </h2>
            <button
              type="button"
              onClick={tutupForm}
              aria-label={ID_TEXT.app.tutup}
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={(e) => void handleSimpanForm(e)} className="space-y-4">
            <div>
              <label
                htmlFor="revisi-isi"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                {ID_TEXT.revisi.form.isiLabel}
              </label>
              <textarea
                id="revisi-isi"
                rows={3}
                maxLength={REVISI_LIMITS.isi}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder={ID_TEXT.revisi.form.isiPlaceholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="revisi-sumber-kategori"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.revisi.form.sumberLabel}
                </label>
                <select
                  id="revisi-sumber-kategori"
                  value={sumberKategori}
                  onChange={(e) =>
                    handleUbahKategoriSumber(e.target.value as SumberRevisiKategori)
                  }
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {SUMBER_REVISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {labelSumberKategori(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="revisi-sumber-nama"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.revisi.form.sumberNamaLabel}
                </label>
                <input
                  id="revisi-sumber-nama"
                  type="text"
                  maxLength={REVISI_LIMITS.sumberNama}
                  value={sumberNama}
                  onChange={(e) => setSumberNama(e.target.value)}
                  placeholder={ID_TEXT.revisi.form.sumberNamaPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="revisi-prioritas"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.revisi.form.prioritasLabel}
                </label>
                <select
                  id="revisi-prioritas"
                  value={prioritas}
                  onChange={(e) => setPrioritas(e.target.value as PrioritasRevisi)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {PRIORITAS_REVISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {ID_TEXT.revisi.prioritasOptions[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="revisi-tenggat"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.revisi.form.tenggatLabel}
                </label>
                <input
                  id="revisi-tenggat"
                  type="date"
                  value={tenggat}
                  onChange={(e) => setTenggat(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="revisi-status"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.revisi.form.statusLabel}
                </label>
                <select
                  id="revisi-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusRevisi)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {STATUS_REVISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {ID_TEXT.revisi.statusOptions[opt]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-rose-700 font-medium" role="alert">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={tutupForm}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base"
              >
                {ID_TEXT.revisi.form.tombolBatal}
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center gap-2 disabled:opacity-60"
              >
                {savingForm && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>
                  {savingForm
                    ? ID_TEXT.revisi.form.tombolMenyimpan
                    : editingId
                      ? ID_TEXT.revisi.form.tombolSimpanEdit
                      : ID_TEXT.revisi.form.tombolSimpan}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Sumber */}
      {revisiList.length > 0 && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="filter-sumber-revisi"
            className="text-sm font-medium text-slate-700 shrink-0"
          >
            {ID_TEXT.revisi.filterLabel}
          </label>
          <select
            id="filter-sumber-revisi"
            value={filterSumber}
            onChange={(e) => setFilterSumber(e.target.value as 'ALL' | SumberRevisiKategori)}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
          >
            <option value="ALL">{ID_TEXT.revisi.filterSemua}</option>
            {SUMBER_REVISI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {labelSumberKategori(opt)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Empty State atau Papan Revisi */}
      {revisiList.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10 text-center max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-2">{ID_TEXT.revisi.emptyJudul}</h2>
          <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
            {ID_TEXT.revisi.emptyDeskripsi}
          </p>
          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
          >
            {ID_TEXT.revisi.emptyTombol}
          </button>
        </section>
      ) : revisiTersaring.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center space-y-2">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {ID_TEXT.revisi.filterKosongJudul}
          </h2>
          <p className="text-base text-slate-600">{ID_TEXT.revisi.filterKosongDeskripsi}</p>
        </section>
      ) : (
        <>
          {/* Mobile: Tab 3 Status */}
          <div className="md:hidden space-y-4">
            <div
              role="tablist"
              aria-label={ID_TEXT.revisi.judul}
              className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl"
            >
              {STATUS_REVISI_OPTIONS.map((st) => {
                const aktif = tabMobile === st;
                const count = revisiPerStatus[st].length;
                return (
                  <button
                    key={st}
                    type="button"
                    role="tab"
                    aria-selected={aktif}
                    onClick={() => setTabMobile(st)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                      aktif
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    {ID_TEXT.revisi.statusOptions[st]} ({count})
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {revisiPerStatus[tabMobile].length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-base text-slate-600 text-center">
                  {ID_TEXT.revisi.kolomKosong(ID_TEXT.revisi.statusOptions[tabMobile])}
                </div>
              ) : (
                revisiPerStatus[tabMobile].map(renderRevisiCard)
              )}
            </div>
          </div>

          {/* Desktop: Papan 3 Kolom */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 items-start">
            {STATUS_REVISI_OPTIONS.map((st) => {
              const items = revisiPerStatus[st];
              return (
                <section
                  key={st}
                  aria-label={ID_TEXT.revisi.statusOptions[st]}
                  className="bg-slate-100/70 rounded-2xl border border-slate-200/70 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-semibold text-[#0F172A]">
                      {ID_TEXT.revisi.statusOptions[st]}
                    </h2>
                    <span className="text-sm font-medium text-slate-500 tabular-nums">
                      {items.length}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="bg-white/80 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 text-center">
                      {ID_TEXT.revisi.kolomKosong(ID_TEXT.revisi.statusOptions[st])}
                    </div>
                  ) : (
                    <div className="space-y-3">{items.map(renderRevisiCard)}</div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* Undo Toast Hapus Revisi */}
      {undoRecord && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F172A] text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-sm leading-snug truncate">{ID_TEXT.revisi.aksi.undoPesan}</p>
          <button
            type="button"
            onClick={() => void handleUndoHapus()}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ID_TEXT.revisi.aksi.undoTombol}</span>
          </button>
        </div>
      )}
    </div>
  );
}
