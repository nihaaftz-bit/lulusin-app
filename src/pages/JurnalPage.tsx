import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { PremiumGate } from '../components/PremiumGate';
import { useJurnal } from '../contexts/JurnalContext';
import { ID_TEXT } from '../i18n/id';
import { fetchCrossRefByDoi } from '../lib/crossref';
import {
  buildReferensiHref,
  filterReferensi,
  formatSitasiAPA7,
  kumpulkanTagUnik,
  normalizeDoi,
  sanitizeExternalUrl,
} from '../lib/jurnalLogic';
import {
  JENIS_REFERENSI_OPTIONS,
  JURNAL_LIMITS,
  STATUS_BACA_OPTIONS,
  type JenisReferensi,
  type ReferensiRecord,
  type StatusBacaReferensi,
} from '../types/jurnal';

export function JurnalPage() {
  const {
    referensiList,
    loading,
    error,
    hasMore,
    muatLebihBanyak,
    tambahReferensi,
    ubahReferensi,
    toggleStatusBaca,
    hapusReferensi,
    batalkanHapusReferensi,
  } = useJurnal();

  // Pencarian & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | StatusBacaReferensi>('ALL');
  const [filterJenis, setFilterJenis] = useState<'ALL' | JenisReferensi>('ALL');

  // Form tambah / edit
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doiLookupInput, setDoiLookupInput] = useState('');
  const [doiLookupLoading, setDoiLookupLoading] = useState(false);
  const [doiLookupFeedback, setDoiLookupFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  const [judul, setJudul] = useState('');
  const [penulisList, setPenulisList] = useState<string[]>([]);
  const [penulisInput, setPenulisInput] = useState('');
  const [penulisError, setPenulisError] = useState<string | null>(null);
  const [tahun, setTahun] = useState('');
  const [jenis, setJenis] = useState<JenisReferensi>('jurnal');
  const [namaSumber, setNamaSumber] = useState('');
  const [volumeInfo, setVolumeInfo] = useState('');
  const [tautan, setTautan] = useState('');
  const [doi, setDoi] = useState('');
  const [catatan, setCatatan] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [statusBaca, setStatusBaca] = useState<StatusBacaReferensi>('Belum dibaca');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Pratinjau sitasi & clipboard
  const [sitasiTerbukaId, setSitasiTerbukaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  // Hapus & Undo
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoRecord, setUndoRecord] = useState<ReferensiRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [aksiPesan, setAksiPesan] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const daftarTagUnik = useMemo(() => kumpulkanTagUnik(referensiList), [referensiList]);

  const referensiTersaring = useMemo(
    () =>
      filterReferensi(referensiList, {
        query: searchQuery,
        tag: filterTag === 'ALL' ? '' : filterTag,
        statusBaca: filterStatus,
        jenis: filterJenis,
      }),
    [referensiList, searchQuery, filterTag, filterStatus, filterJenis]
  );

  function bukaFormTambah() {
    setEditingId(null);
    setDoiLookupInput('');
    setDoiLookupFeedback(null);
    setJudul('');
    setPenulisList([]);
    setPenulisInput('');
    setPenulisError(null);
    setTahun('');
    setJenis('jurnal');
    setNamaSumber('');
    setVolumeInfo('');
    setTautan('');
    setDoi('');
    setCatatan('');
    setTagList([]);
    setTagInput('');
    setTagError(null);
    setStatusBaca('Belum dibaca');
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function bukaFormEdit(record: ReferensiRecord) {
    setEditingId(record.referensiId);
    setDoiLookupInput(record.doi);
    setDoiLookupFeedback(null);
    setJudul(record.judul);
    setPenulisList([...record.penulis]);
    setPenulisInput('');
    setPenulisError(null);
    setTahun(record.tahun);
    setJenis(record.jenis);
    setNamaSumber(record.namaSumber);
    setVolumeInfo(record.volumeInfo);
    setTautan(record.tautan);
    setDoi(record.doi);
    setCatatan(record.catatan);
    setTagList([...record.tag]);
    setTagInput('');
    setTagError(null);
    setStatusBaca(record.statusBaca);
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function tutupForm() {
    setFormTerbuka(false);
    setEditingId(null);
    setFormError(null);
    setPenulisError(null);
    setTagError(null);
    setDoiLookupFeedback(null);
  }

  async function handleLookupDoi() {
    if (doiLookupLoading) return;
    setDoiLookupFeedback(null);
    setDoiLookupLoading(true);
    const result = await fetchCrossRefByDoi(doiLookupInput);
    setDoiLookupLoading(false);

    if (!result.ok) {
      const msg =
        result.reason === 'invalid_doi'
          ? ID_TEXT.jurnal.form.doiAutofillGagalInvalid
          : result.reason === 'not_found'
            ? ID_TEXT.jurnal.form.doiAutofillGagalNotFound
            : ID_TEXT.jurnal.form.doiAutofillGagalJaringan;
      setDoiLookupFeedback({ type: 'info', message: msg });
      return;
    }

    const data = result.data;
    setJudul(data.judul);
    if (data.penulis.length > 0) setPenulisList(data.penulis);
    if (data.tahun) setTahun(data.tahun);
    setJenis(data.jenis);
    if (data.namaSumber) setNamaSumber(data.namaSumber);
    if (data.volumeInfo) setVolumeInfo(data.volumeInfo);
    if (data.tautan) setTautan(data.tautan);
    setDoi(data.doi);
    setDoiLookupFeedback({
      type: 'success',
      message: ID_TEXT.jurnal.form.doiAutofillSukses,
    });
  }

  function handleTambahPenulis() {
    const clean = penulisInput.trim();
    if (!clean) return;
    if (clean.length > JURNAL_LIMITS.penulisItem) {
      setPenulisError(ID_TEXT.jurnal.validasi.penulisPanjang);
      return;
    }
    if (penulisList.length >= JURNAL_LIMITS.penulisMax) {
      setPenulisError(ID_TEXT.jurnal.validasi.penulisBatas);
      return;
    }
    setPenulisError(null);
    setPenulisList((prev) => [...prev, clean]);
    setPenulisInput('');
  }

  function handleHapusPenulis(index: number) {
    setPenulisList((prev) => prev.filter((_, idx) => idx !== index));
    setPenulisError(null);
  }

  function handleTambahTag() {
    const pieces = tagInput
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (pieces.length === 0) return;

    for (const p of pieces) {
      if (p.length > JURNAL_LIMITS.tagItem) {
        setTagError(ID_TEXT.jurnal.validasi.tagPanjang);
        return;
      }
    }

    const merged = [...tagList];
    const existingLower = new Set(merged.map((t) => t.toLowerCase()));
    for (const p of pieces) {
      if (!existingLower.has(p.toLowerCase())) {
        if (merged.length >= JURNAL_LIMITS.tagMax) {
          setTagError(ID_TEXT.jurnal.validasi.tagBatas);
          return;
        }
        merged.push(p);
        existingLower.add(p.toLowerCase());
      }
    }

    setTagError(null);
    setTagList(merged);
    setTagInput('');
  }

  function handleHapusTag(index: number) {
    setTagList((prev) => prev.filter((_, idx) => idx !== index));
    setTagError(null);
  }

  async function handleSimpanForm(e: React.FormEvent) {
    e.preventDefault();
    const judulTrim = judul.trim();
    if (!judulTrim) {
      setFormError(ID_TEXT.jurnal.validasi.judulWajib);
      return;
    }
    if (judulTrim.length > JURNAL_LIMITS.judul) {
      setFormError(ID_TEXT.jurnal.validasi.judulPanjang);
      return;
    }

    // Sertakan input penulis/tag yang belum sempat diklik Tambah
    let finalPenulis = [...penulisList];
    const sisaPenulis = penulisInput.trim();
    if (sisaPenulis) {
      if (sisaPenulis.length > JURNAL_LIMITS.penulisItem) {
        setFormError(ID_TEXT.jurnal.validasi.penulisPanjang);
        return;
      }
      if (finalPenulis.length >= JURNAL_LIMITS.penulisMax) {
        setFormError(ID_TEXT.jurnal.validasi.penulisBatas);
        return;
      }
      finalPenulis = [...finalPenulis, sisaPenulis];
    }

    let finalTag = [...tagList];
    const sisaTag = tagInput
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (sisaTag.length > 0) {
      const existingLower = new Set(finalTag.map((t) => t.toLowerCase()));
      for (const p of sisaTag) {
        if (p.length > JURNAL_LIMITS.tagItem) {
          setFormError(ID_TEXT.jurnal.validasi.tagPanjang);
          return;
        }
        if (!existingLower.has(p.toLowerCase())) {
          if (finalTag.length >= JURNAL_LIMITS.tagMax) {
            setFormError(ID_TEXT.jurnal.validasi.tagBatas);
            return;
          }
          finalTag.push(p);
          existingLower.add(p.toLowerCase());
        }
      }
    }

    const tautanTrim = tautan.trim();
    if (tautanTrim) {
      if (tautanTrim.length > JURNAL_LIMITS.tautan) {
        setFormError(ID_TEXT.jurnal.validasi.tautanPanjang);
        return;
      }
      if (!sanitizeExternalUrl(tautanTrim)) {
        setFormError(ID_TEXT.jurnal.validasi.tautanFormat);
        return;
      }
    }

    if (tahun.trim().length > JURNAL_LIMITS.tahun) {
      setFormError(ID_TEXT.jurnal.validasi.tahunPanjang);
      return;
    }
    if (namaSumber.trim().length > JURNAL_LIMITS.namaSumber) {
      setFormError(ID_TEXT.jurnal.validasi.namaSumberPanjang);
      return;
    }
    if (volumeInfo.trim().length > JURNAL_LIMITS.volumeInfo) {
      setFormError(ID_TEXT.jurnal.validasi.volumePanjang);
      return;
    }
    if (doi.trim().length > JURNAL_LIMITS.doi) {
      setFormError(ID_TEXT.jurnal.validasi.doiPanjang);
      return;
    }
    if (catatan.trim().length > JURNAL_LIMITS.catatan) {
      setFormError(ID_TEXT.jurnal.validasi.catatanPanjang);
      return;
    }
    if (!editingId && referensiList.length >= JURNAL_LIMITS.maxItems) {
      setFormError(ID_TEXT.jurnal.validasi.batasMaks);
      return;
    }

    setFormError(null);
    setSavingForm(true);
    try {
      const payload = {
        judul: judulTrim,
        penulis: finalPenulis,
        tahun: tahun.trim(),
        jenis,
        namaSumber: namaSumber.trim(),
        volumeInfo: volumeInfo.trim(),
        tautan: tautanTrim,
        doi: normalizeDoi(doi) || doi.trim(),
        catatan: catatan.trim(),
        tag: finalTag,
        statusBaca,
      };
      if (editingId) {
        await ubahReferensi(editingId, payload);
      } else {
        await tambahReferensi(payload);
      }
      tutupForm();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BATAS_MAKS_REFERENSI') {
        setFormError(ID_TEXT.jurnal.validasi.batasMaks);
      } else {
        setFormError(ID_TEXT.jurnal.errorSimpan);
      }
    } finally {
      setSavingForm(false);
    }
  }

  async function handleToggleStatusBaca(record: ReferensiRecord) {
    setAksiError(null);
    setTogglingId(record.referensiId);
    const statusBaru: StatusBacaReferensi =
      record.statusBaca === 'Sudah dibaca' ? 'Belum dibaca' : 'Sudah dibaca';
    try {
      await toggleStatusBaca(record.referensiId, statusBaru);
    } catch {
      setAksiError(ID_TEXT.jurnal.errorSimpan);
    } finally {
      setTogglingId(null);
    }
  }

  async function salinTeksSitasi(referensiId: string, teks: string) {
    setCopyErrorId(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(teks);
        setCopiedId(referensiId);
        if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2500);
      } else {
        setCopyErrorId(referensiId);
      }
    } catch {
      setCopyErrorId(referensiId);
    }
  }

  async function handleKlikSalinSitasi(record: ReferensiRecord) {
    const sudahTerbuka = sitasiTerbukaId === record.referensiId;
    if (sudahTerbuka) {
      setSitasiTerbukaId(null);
      return;
    }
    setSitasiTerbukaId(record.referensiId);
    const sitasi = formatSitasiAPA7(record);
    await salinTeksSitasi(record.referensiId, sitasi);
  }

  async function handleHapus(record: ReferensiRecord) {
    setAksiError(null);
    try {
      await hapusReferensi(record);
      setConfirmDeleteId(null);
      if (editingId === record.referensiId) {
        tutupForm();
      }
      setUndoRecord(record);
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setUndoRecord(null);
      }, 6000);
    } catch {
      setAksiError(ID_TEXT.jurnal.errorSimpan);
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
      await batalkanHapusReferensi(recordToRestore);
    } catch {
      setAksiError(ID_TEXT.jurnal.errorSimpan);
    }
  }

  function renderReferensiCard(record: ReferensiRecord) {
    const isConfirmDelete = confirmDeleteId === record.referensiId;
    const isToggling = togglingId === record.referensiId;
    const href = buildReferensiHref(record.tautan, record.doi);
    const pratinjauTerbuka = sitasiTerbukaId === record.referensiId;
    const sitasiApa7 = pratinjauTerbuka ? formatSitasiAPA7(record) : '';
    const penulisTeks = record.penulis.join(', ');

    return (
      <article
        key={record.referensiId}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3.5"
      >
        {/* Metadata ringkas tanpa pill */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span className="font-medium text-[#4F46E5]">
                {ID_TEXT.jurnal.jenisOptions[record.jenis]}
              </span>
              {record.tahun && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-medium text-slate-700">{record.tahun}</span>
                </>
              )}
              {record.namaSumber && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-600">{record.namaSumber}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  record.statusBaca === 'Sudah dibaca' ? 'text-[#10B981]' : 'text-slate-600'
                }`}
              >
                {record.statusBaca === 'Sudah dibaca' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{ID_TEXT.jurnal.statusBacaOptions[record.statusBaca]}</span>
              </span>
            </div>

            <h3 className="text-lg font-semibold text-[#0F172A] leading-snug">{record.judul}</h3>

            {penulisTeks && <p className="text-sm sm:text-base text-slate-600">{penulisTeks}</p>}
          </div>

          {/* Aksi kartu */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isToggling}
              onClick={() => void handleToggleStatusBaca(record)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:opacity-60"
            >
              {record.statusBaca === 'Sudah dibaca' ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
              <span>
                {record.statusBaca === 'Sudah dibaca'
                  ? ID_TEXT.jurnal.kartu.tandaiBelumDibaca
                  : ID_TEXT.jurnal.kartu.tandaiSudahDibaca}
              </span>
            </button>

            {isConfirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleHapus(record)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium whitespace-nowrap"
                >
                  {ID_TEXT.jurnal.kartu.konfirmasiYa}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium whitespace-nowrap"
                >
                  {ID_TEXT.jurnal.kartu.konfirmasiBatal}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => bukaFormEdit(record)}
                  aria-label={`${ID_TEXT.jurnal.kartu.ubah}: ${record.judul}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(record.referensiId)}
                  aria-label={`${ID_TEXT.jurnal.kartu.hapus}: ${record.judul}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Catatan "Kenapa ini penting" */}
        {record.catatan && (
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <p className="text-xs font-semibold text-slate-500">
              {ID_TEXT.jurnal.kartu.catatanJudul}
            </p>
            <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {record.catatan}
            </p>
          </div>
        )}

        {/* Tag teks polos + Tautan & Tombol Salin Sitasi */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500 min-w-0">
            {record.tag.length > 0 && (
              <span className="truncate">
                {record.tag.map((t) => `#${t}`).join(' · ')}
              </span>
            )}
            {record.doi && (
              <>
                {record.tag.length > 0 && <span aria-hidden="true">·</span>}
                <span className="tabular-nums truncate">DOI: {record.doi}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.jurnal.kartu.bukaTautan}</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => void handleKlikSalinSitasi(record)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-[#4F46E5] text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Quote className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {pratinjauTerbuka
                  ? ID_TEXT.jurnal.kartu.tutupPratinjau
                  : ID_TEXT.jurnal.kartu.salinSitasi}
              </span>
            </button>
          </div>
        </div>

        {/* Pratinjau Sitasi APA 7 & Peringatan Ringan */}
        {pratinjauTerbuka && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0F172A]">
                {ID_TEXT.jurnal.kartu.pratinjauJudul}
              </p>
              <button
                type="button"
                onClick={() => void salinTeksSitasi(record.referensiId, sitasiApa7)}
                className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sm font-medium text-[#0F172A] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {copiedId === record.referensiId ? (
                  <>
                    <Check className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    <span className="text-[#10B981]">{ID_TEXT.jurnal.kartu.tersalin}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>{ID_TEXT.jurnal.kartu.salinTeks}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm sm:text-base text-[#0F172A] leading-relaxed select-all break-words">
              {sitasiApa7}
            </p>

            {copyErrorId === record.referensiId && (
              <p className="text-xs text-amber-800">{ID_TEXT.jurnal.kartu.salinGagal}</p>
            )}

            <p className="text-xs text-slate-600">{ID_TEXT.jurnal.kartu.peringatanKampus}</p>
          </div>
        )}
      </article>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={ID_TEXT.app.memuat}>
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-36 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        <div className="h-36 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Halaman */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {ID_TEXT.jurnal.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">{ID_TEXT.jurnal.subjudul}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <PremiumGate
            feature="ekspor_sitasi_massal"
            label="Salin semua sitasi"
            onAuthorized={() => {
              setAksiError(null);
              setAksiPesan(null);
              const targetList =
                referensiTersaring.length > 0 ? referensiTersaring : referensiList;
              if (targetList.length === 0) {
                setAksiPesan('Belum ada referensi untuk disalin.');
                return;
              }
              const citations = targetList
                .map((r) => formatSitasiAPA7(r))
                .sort((a, b) => a.localeCompare(b, 'id'));
              void navigator.clipboard
                .writeText(citations.join('\n\n'))
                .then(() => {
                  setAksiPesan(
                    `${citations.length} sitasi APA 7 berhasil disalin ke clipboard.`
                  );
                })
                .catch(() => {
                  setAksiError(
                    'Browser memblokir akses clipboard. Izinkan akses salin lalu coba lagi.'
                  );
                });
            }}
          />

          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.jurnal.tombolTambahHeader.replace(/^\+\s*/, '')}</span>
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
          <span>{aksiError || ID_TEXT.jurnal.errorMuat}</span>
        </div>
      )}

      {/* Form Tambah / Ubah Referensi */}
      {formTerbuka && (
        <section
          aria-label={editingId ? ID_TEXT.jurnal.form.judulEdit : ID_TEXT.jurnal.form.judulTambah}
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {editingId ? ID_TEXT.jurnal.form.judulEdit : ID_TEXT.jurnal.form.judulTambah}
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

          {/* Opsional: Isi otomatis dari DOI */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5">
            <label
              htmlFor="jurnal-doi-autofill"
              className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
            >
              <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.jurnal.form.doiAutofillJudul}</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="jurnal-doi-autofill"
                type="text"
                value={doiLookupInput}
                onChange={(e) => setDoiLookupInput(e.target.value)}
                placeholder={ID_TEXT.jurnal.form.doiAutofillPlaceholder}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
              />
              <button
                type="button"
                disabled={doiLookupLoading || !doiLookupInput.trim()}
                onClick={() => void handleLookupDoi()}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-[#4F46E5] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {doiLookupLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>
                  {doiLookupLoading
                    ? ID_TEXT.jurnal.form.doiAutofillMemuat
                    : ID_TEXT.jurnal.form.doiAutofillTombol}
                </span>
              </button>
            </div>
            {doiLookupFeedback && (
              <p
                className={`text-sm ${
                  doiLookupFeedback.type === 'success' ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {doiLookupFeedback.message}
              </p>
            )}
          </div>

          <form onSubmit={(e) => void handleSimpanForm(e)} className="space-y-4">
            <div>
              <label
                htmlFor="jurnal-judul"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                {ID_TEXT.jurnal.form.judulLabel}
              </label>
              <input
                id="jurnal-judul"
                type="text"
                maxLength={JURNAL_LIMITS.judul}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder={ID_TEXT.jurnal.form.judulPlaceholder}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            {/* Penulis (bisa banyak) */}
            <div className="space-y-2">
              <label
                htmlFor="jurnal-penulis-input"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.jurnal.form.penulisLabel}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="jurnal-penulis-input"
                  type="text"
                  maxLength={JURNAL_LIMITS.penulisItem}
                  value={penulisInput}
                  onChange={(e) => setPenulisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTambahPenulis();
                    }
                  }}
                  placeholder={ID_TEXT.jurnal.form.penulisPlaceholder}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTambahPenulis}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#0F172A] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.jurnal.form.penulisTambah}</span>
                </button>
              </div>
              {penulisError && <p className="text-sm text-rose-700">{penulisError}</p>}
              {penulisList.length === 0 ? (
                <p className="text-xs text-slate-500">{ID_TEXT.jurnal.form.penulisKosong}</p>
              ) : (
                <ul className="space-y-1.5">
                  {penulisList.map((nama, idx) => (
                    <li
                      key={`${nama}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-1.5"
                    >
                      <span className="text-sm sm:text-base text-[#0F172A] truncate">{nama}</span>
                      <button
                        type="button"
                        onClick={() => handleHapusPenulis(idx)}
                        aria-label={`${ID_TEXT.jurnal.form.penulisHapus}: ${nama}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="jurnal-jenis"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.form.jenisLabel}
                </label>
                <select
                  id="jurnal-jenis"
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as JenisReferensi)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {JENIS_REFERENSI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {ID_TEXT.jurnal.jenisOptions[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="jurnal-tahun"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.form.tahunLabel}
                </label>
                <input
                  id="jurnal-tahun"
                  type="text"
                  inputMode="numeric"
                  maxLength={JURNAL_LIMITS.tahun}
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder={ID_TEXT.jurnal.form.tahunPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="jurnal-status-baca"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.form.statusBacaLabel}
                </label>
                <select
                  id="jurnal-status-baca"
                  value={statusBaca}
                  onChange={(e) => setStatusBaca(e.target.value as StatusBacaReferensi)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  {STATUS_BACA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {ID_TEXT.jurnal.statusBacaOptions[opt]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jurnal-nama-sumber"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.namaSumberLabelByJenis[jenis]}
                </label>
                <input
                  id="jurnal-nama-sumber"
                  type="text"
                  maxLength={JURNAL_LIMITS.namaSumber}
                  value={namaSumber}
                  onChange={(e) => setNamaSumber(e.target.value)}
                  placeholder={ID_TEXT.jurnal.namaSumberPlaceholderByJenis[jenis]}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>

              {(jenis === 'jurnal' || jenis === 'lainnya') && (
                <div>
                  <label
                    htmlFor="jurnal-volume"
                    className="block text-sm font-medium text-[#0F172A] mb-1.5"
                  >
                    {ID_TEXT.jurnal.form.volumeLabel}
                  </label>
                  <input
                    id="jurnal-volume"
                    type="text"
                    maxLength={JURNAL_LIMITS.volumeInfo}
                    value={volumeInfo}
                    onChange={(e) => setVolumeInfo(e.target.value)}
                    placeholder={ID_TEXT.jurnal.form.volumePlaceholder}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jurnal-tautan"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.form.tautanLabel}
                </label>
                <input
                  id="jurnal-tautan"
                  type="url"
                  maxLength={JURNAL_LIMITS.tautan}
                  value={tautan}
                  onChange={(e) => setTautan(e.target.value)}
                  placeholder={ID_TEXT.jurnal.form.tautanPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{ID_TEXT.jurnal.form.tautanCatatan}</p>
              </div>

              <div>
                <label
                  htmlFor="jurnal-doi"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.jurnal.form.doiLabel}
                </label>
                <input
                  id="jurnal-doi"
                  type="text"
                  maxLength={JURNAL_LIMITS.doi}
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder={ID_TEXT.jurnal.form.doiPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="jurnal-catatan"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                {ID_TEXT.jurnal.form.catatanLabel}
              </label>
              <textarea
                id="jurnal-catatan"
                rows={3}
                maxLength={JURNAL_LIMITS.catatan}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={ID_TEXT.jurnal.form.catatanPlaceholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Tag */}
            <div className="space-y-2">
              <label
                htmlFor="jurnal-tag-input"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.jurnal.form.tagLabel}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="jurnal-tag-input"
                  type="text"
                  maxLength={JURNAL_LIMITS.tagItem * 2}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTambahTag();
                    }
                  }}
                  placeholder={ID_TEXT.jurnal.form.tagPlaceholder}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTambahTag}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#0F172A] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.jurnal.form.tagTambah}</span>
                </button>
              </div>
              {tagError && <p className="text-sm text-rose-700">{tagError}</p>}
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag, idx) => (
                    <button
                      key={`${tag}-${idx}`}
                      type="button"
                      onClick={() => handleHapusTag(idx)}
                      aria-label={`${ID_TEXT.jurnal.form.tagHapus}: ${tag}`}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-sm text-[#0F172A] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>#{tag}</span>
                      <X className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
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
                {ID_TEXT.jurnal.form.tombolBatal}
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center gap-2 disabled:opacity-60"
              >
                {savingForm && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>
                  {savingForm
                    ? ID_TEXT.jurnal.form.tombolMenyimpan
                    : editingId
                      ? ID_TEXT.jurnal.form.tombolSimpanEdit
                      : ID_TEXT.jurnal.form.tombolSimpan}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Bilah Pencarian & Filter */}
      {referensiList.length > 0 && (
        <section
          aria-label={ID_TEXT.jurnal.cariLabel}
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          <div className="md:col-span-5 relative">
            <label htmlFor="cari-jurnal" className="sr-only">
              {ID_TEXT.jurnal.cariLabel}
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="cari-jurnal"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ID_TEXT.jurnal.cariPlaceholder}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="filter-tag-jurnal" className="sr-only">
              {ID_TEXT.jurnal.filterTagLabel}
            </label>
            <select
              id="filter-tag-jurnal"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="ALL">{ID_TEXT.jurnal.filterTagSemua}</option>
              {daftarTagUnik.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-jenis-jurnal" className="sr-only">
              {ID_TEXT.jurnal.filterJenisLabel}
            </label>
            <select
              id="filter-jenis-jurnal"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value as 'ALL' | JenisReferensi)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="ALL">{ID_TEXT.jurnal.filterJenisSemua}</option>
              {JENIS_REFERENSI_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {ID_TEXT.jurnal.jenisOptions[opt]}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-status-jurnal" className="sr-only">
              {ID_TEXT.jurnal.filterStatusLabel}
            </label>
            <select
              id="filter-status-jurnal"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | StatusBacaReferensi)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="ALL">{ID_TEXT.jurnal.filterStatusSemua}</option>
              {STATUS_BACA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {ID_TEXT.jurnal.statusBacaOptions[opt]}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Empty State atau Daftar Referensi */}
      {referensiList.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10 text-center max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
            {ID_TEXT.jurnal.emptyJudul}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
            {ID_TEXT.jurnal.emptyDeskripsi}
          </p>
          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
          >
            {ID_TEXT.jurnal.emptyTombol}
          </button>
        </section>
      ) : referensiTersaring.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center space-y-2">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {ID_TEXT.jurnal.filterKosongJudul}
          </h2>
          <p className="text-base text-slate-600">{ID_TEXT.jurnal.filterKosongDeskripsi}</p>
        </section>
      ) : (
        <div className="space-y-4">
          {referensiTersaring.map(renderReferensiCard)}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={muatLebihBanyak}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base transition-colors"
              >
                {ID_TEXT.jurnal.muatLebihBanyak}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Undo Toast Hapus Referensi */}
      {undoRecord && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F172A] text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-sm leading-snug truncate">
            {ID_TEXT.jurnal.kartu.undoPesan(undoRecord.judul)}
          </p>
          <button
            type="button"
            onClick={() => void handleUndoHapus()}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ID_TEXT.jurnal.kartu.undoTombol}</span>
          </button>
        </div>
      )}
    </div>
  );
}
