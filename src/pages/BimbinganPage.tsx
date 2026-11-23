import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Info,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { PremiumGate } from '../components/PremiumGate';
import { useAuth } from '../contexts/AuthContext';
import { useBimbinganRevisi } from '../contexts/BimbinganRevisiContext';
import { useRoadmap } from '../contexts/RoadmapContext';
import { ID_TEXT } from '../i18n/id';
import {
  formatWaktuIndonesia,
  localDateTimeInputToIso,
  toLocalDateTimeInputValue,
} from '../lib/date';
import { cariTahapAktif, kelompokkanBimbingan } from '../lib/skripsiLogic';
import {
  BIMBINGAN_LIMITS,
  type BimbinganRecord,
  type TindakLanjutItem,
} from '../types/bimbinganRevisi';
import { ROADMAP_LIMITS } from '../types/roadmap';

function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function BimbinganPage() {
  const { profile } = useAuth();
  const {
    bimbinganList,
    loading,
    error,
    tambahBimbingan,
    ubahBimbingan,
    toggleSelesaiBimbingan,
    updateTindakLanjutBimbingan,
    hapusBimbingan,
    batalkanHapusBimbingan,
  } = useBimbinganRevisi();
  const { tahapList, tugasList, tambahTugas } = useRoadmap();

  const dospem1 = profile?.dosenPembimbing1?.trim() || '';
  const dospem2 = profile?.dosenPembimbing2?.trim() || '';
  const belumAdaDospemDiProfil = !dospem1 && !dospem2;

  // Filter dosen
  const [filterDosen, setFilterDosen] = useState<string>('ALL');

  // Form tambah / edit
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggalLocal, setTanggalLocal] = useState('');
  const [dosen, setDosen] = useState('');
  const [topik, setTopik] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [tindakLanjutDraft, setTindakLanjutDraft] = useState<TindakLanjutItem[]>([]);
  const [tindakLanjutInput, setTindakLanjutInput] = useState('');
  const [tindakLanjutError, setTindakLanjutError] = useState<string | null>(null);
  const [selesai, setSelesai] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Hapus & Undo
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [undoRecord, setUndoRecord] = useState<BimbinganRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Konversi tindak lanjut -> tugas Roadmap
  const [convertingKeys, setConvertingKeys] = useState<Record<string, boolean>>({});
  const [aksiPesan, setAksiPesan] = useState<string | null>(null);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const daftarDosenUnik = useMemo(() => {
    const set = new Set<string>();
    if (dospem1) set.add(dospem1);
    if (dospem2) set.add(dospem2);
    for (const item of bimbinganList) {
      if (item.dosen.trim()) set.add(item.dosen.trim());
    }
    return Array.from(set);
  }, [dospem1, dospem2, bimbinganList]);

  const bimbinganTersaring = useMemo(() => {
    if (filterDosen === 'ALL') return bimbinganList;
    return bimbinganList.filter(
      (item) => item.dosen.trim().toLowerCase() === filterDosen.trim().toLowerCase()
    );
  }, [bimbinganList, filterDosen]);

  const { akanDatang, riwayat } = useMemo(
    () => kelompokkanBimbingan(bimbinganTersaring),
    [bimbinganTersaring]
  );

  const existingRoadmapTugasIds = useMemo(
    () => new Set(tugasList.map((t) => t.tugasId)),
    [tugasList]
  );

  const targetTahapDefault = useMemo(() => {
    return (
      cariTahapAktif(tahapList, tugasList) ||
      tahapList.find((t) => !t.tersembunyi) ||
      tahapList[0] ||
      null
    );
  }, [tahapList, tugasList]);

  function bukaFormTambah() {
    setEditingId(null);
    setTanggalLocal(toLocalDateTimeInputValue());
    setDosen(dospem1 || dospem2 || '');
    setTopik('');
    setRingkasan('');
    setTindakLanjutDraft([]);
    setTindakLanjutInput('');
    setTindakLanjutError(null);
    setSelesai(false);
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function bukaFormEdit(record: BimbinganRecord) {
    setEditingId(record.bimbinganId);
    setTanggalLocal(toLocalDateTimeInputValue(record.tanggalIso));
    setDosen(record.dosen);
    setTopik(record.topik);
    setRingkasan(record.ringkasan);
    setTindakLanjutDraft(record.tindakLanjut.map((item) => ({ ...item })));
    setTindakLanjutInput('');
    setTindakLanjutError(null);
    setSelesai(record.selesai);
    setFormError(null);
    setFormTerbuka(true);
    setConfirmDeleteId(null);
  }

  function tutupForm() {
    setFormTerbuka(false);
    setEditingId(null);
    setFormError(null);
    setTindakLanjutError(null);
  }

  function handleTambahTindakLanjutDraft() {
    const judulTrim = tindakLanjutInput.trim();
    if (!judulTrim) {
      setTindakLanjutError(ID_TEXT.bimbingan.validasi.tindakLanjutKosong);
      return;
    }
    if (judulTrim.length > BIMBINGAN_LIMITS.tindakLanjutJudul) {
      setTindakLanjutError(ID_TEXT.bimbingan.validasi.tindakLanjutPanjang);
      return;
    }
    if (tindakLanjutDraft.length >= BIMBINGAN_LIMITS.tindakLanjutMax) {
      setTindakLanjutError(ID_TEXT.bimbingan.form.tindakLanjutBatas);
      return;
    }

    setTindakLanjutError(null);
    setTindakLanjutDraft((prev) => [
      ...prev,
      {
        id: createLocalId(),
        judul: judulTrim,
        selesai: false,
        roadmapTugasId: '',
      },
    ]);
    setTindakLanjutInput('');
  }

  function handleHapusTindakLanjutDraft(id: string) {
    setTindakLanjutDraft((prev) => prev.filter((item) => item.id !== id));
    setTindakLanjutError(null);
  }

  async function handleSimpanForm(e: React.FormEvent) {
    e.preventDefault();
    const tanggalIso = localDateTimeInputToIso(tanggalLocal);
    if (!tanggalIso) {
      setFormError(ID_TEXT.bimbingan.validasi.tanggalWajib);
      return;
    }
    const dosenTrim = dosen.trim();
    if (!dosenTrim) {
      setFormError(ID_TEXT.bimbingan.validasi.dosenWajib);
      return;
    }
    if (dosenTrim.length > BIMBINGAN_LIMITS.dosen) {
      setFormError(ID_TEXT.bimbingan.validasi.dosenPanjang);
      return;
    }
    const topikTrim = topik.trim();
    if (!topikTrim) {
      setFormError(ID_TEXT.bimbingan.validasi.topikWajib);
      return;
    }
    if (topikTrim.length > BIMBINGAN_LIMITS.topik) {
      setFormError(ID_TEXT.bimbingan.validasi.topikPanjang);
      return;
    }
    if (ringkasan.trim().length > BIMBINGAN_LIMITS.ringkasan) {
      setFormError(ID_TEXT.bimbingan.validasi.ringkasanPanjang);
      return;
    }
    if (!editingId && bimbinganList.length >= BIMBINGAN_LIMITS.maxItems) {
      setFormError(ID_TEXT.bimbingan.validasi.batasMaks);
      return;
    }

    // Jika user mengetik tindak lanjut di input namun lupa menekan tombol Tambah item, sertakan sekalian bila valid
    let finalTindakLanjut = tindakLanjutDraft;
    const sisaInput = tindakLanjutInput.trim();
    if (sisaInput) {
      if (sisaInput.length > BIMBINGAN_LIMITS.tindakLanjutJudul) {
        setFormError(ID_TEXT.bimbingan.validasi.tindakLanjutPanjang);
        return;
      }
      if (finalTindakLanjut.length >= BIMBINGAN_LIMITS.tindakLanjutMax) {
        setFormError(ID_TEXT.bimbingan.form.tindakLanjutBatas);
        return;
      }
      finalTindakLanjut = [
        ...finalTindakLanjut,
        {
          id: createLocalId(),
          judul: sisaInput,
          selesai: false,
          roadmapTugasId: '',
        },
      ];
    }

    setFormError(null);
    setSavingForm(true);
    try {
      const payload = {
        tanggalIso,
        dosen: dosenTrim,
        topik: topikTrim,
        ringkasan: ringkasan.trim(),
        tindakLanjut: finalTindakLanjut,
        selesai,
      };
      if (editingId) {
        await ubahBimbingan(editingId, payload);
      } else {
        await tambahBimbingan(payload);
      }
      tutupForm();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BATAS_MAKS_BIMBINGAN') {
        setFormError(ID_TEXT.bimbingan.validasi.batasMaks);
      } else {
        setFormError(ID_TEXT.bimbingan.errorSimpan);
      }
    } finally {
      setSavingForm(false);
    }
  }

  async function handleToggleSelesai(record: BimbinganRecord) {
    setAksiError(null);
    setTogglingId(record.bimbinganId);
    try {
      await toggleSelesaiBimbingan(record.bimbinganId, !record.selesai);
    } catch {
      setAksiError(ID_TEXT.bimbingan.errorSimpan);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSalinLogbook() {
    setAksiError(null);
    setAksiPesan(null);
    if (bimbinganList.length === 0) {
      setAksiPesan('Belum ada catatan bimbingan untuk disalin.');
      return;
    }

    const teks = bimbinganList
      .map((item, idx) => {
        const tindak =
          item.tindakLanjut.length > 0
            ? item.tindakLanjut
                .map((tl) => `  - [${tl.selesai ? 'x' : ' '}] ${tl.judul}`)
                .join('\n')
            : '  - Tidak ada tindak lanjut';
        return `${idx + 1}. ${formatWaktuIndonesia(item.tanggalIso)} — ${item.dosen}\n   Topik: ${item.topik}\n   Ringkasan: ${item.ringkasan || '-'}\n   Tindak lanjut:\n${tindak}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(teks);
      setAksiPesan('Logbook bimbingan berhasil disalin ke clipboard.');
    } catch {
      setAksiError('Browser memblokir akses clipboard. Izinkan akses salin lalu coba lagi.');
    }
  }

  async function handleToggleTindakLanjutItem(record: BimbinganRecord, itemId: string) {
    setAksiError(null);
    const updated = record.tindakLanjut.map((item) =>
      item.id === itemId ? { ...item, selesai: !item.selesai } : item
    );
    try {
      await updateTindakLanjutBimbingan(record.bimbinganId, updated);
    } catch {
      setAksiError(ID_TEXT.bimbingan.errorSimpan);
    }
  }

  async function handleJadikanTugas(record: BimbinganRecord, item: TindakLanjutItem) {
    const key = `${record.bimbinganId}:${item.id}`;
    if (convertingKeys[key]) return;
    if (item.roadmapTugasId && existingRoadmapTugasIds.has(item.roadmapTugasId)) {
      return;
    }
    if (!targetTahapDefault) {
      setAksiError(ID_TEXT.bimbingan.validasi.roadmapBelumSiap);
      return;
    }
    if (tugasList.length >= ROADMAP_LIMITS.maxItems) {
      setAksiError(ID_TEXT.bimbingan.validasi.batasMaksRoadmap);
      return;
    }

    setAksiError(null);
    setAksiPesan(null);
    setConvertingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const tugasIdBaru = await tambahTugas({
        tahapId: targetTahapDefault.tahapId,
        judul: item.judul,
        tenggat: '',
      });
      if (tugasIdBaru) {
        const updatedList = record.tindakLanjut.map((tl) =>
          tl.id === item.id ? { ...tl, roadmapTugasId: tugasIdBaru } : tl
        );
        await updateTindakLanjutBimbingan(record.bimbinganId, updatedList);
        setAksiPesan(ID_TEXT.bimbingan.aksi.suksesDiRoadmap(targetTahapDefault.judul));
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BATAS_MAKS_TUGAS') {
        setAksiError(ID_TEXT.bimbingan.validasi.batasMaksRoadmap);
      } else {
        setAksiError(ID_TEXT.bimbingan.errorSimpan);
      }
    } finally {
      setConvertingKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleHapus(record: BimbinganRecord) {
    setAksiError(null);
    try {
      await hapusBimbingan(record);
      setConfirmDeleteId(null);
      if (editingId === record.bimbinganId) {
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
      setAksiError(ID_TEXT.bimbingan.errorSimpan);
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
      await batalkanHapusBimbingan(recordToRestore);
    } catch {
      setAksiError(ID_TEXT.bimbingan.errorSimpan);
    }
  }

  function renderBimbinganCard(record: BimbinganRecord) {
    const isConfirmDelete = confirmDeleteId === record.bimbinganId;
    const isToggling = togglingId === record.bimbinganId;

    return (
      <article
        key={record.bimbinganId}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0F172A]">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{formatWaktuIndonesia(record.tanggalIso)}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{record.dosen}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  record.selesai ? 'text-[#10B981]' : 'text-[#4F46E5]'
                }`}
              >
                {record.selesai ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {record.selesai
                    ? ID_TEXT.bimbingan.statusSelesaiTeks
                    : ID_TEXT.bimbingan.statusTerjadwalTeks}
                </span>
              </span>
            </div>

            <h3 className="text-lg font-semibold text-[#0F172A] leading-snug">{record.topik}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isToggling}
              onClick={() => void handleToggleSelesai(record)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {record.selesai ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
              <span>
                {record.selesai
                  ? ID_TEXT.bimbingan.aksi.tandaiBelumSelesai
                  : ID_TEXT.bimbingan.aksi.tandaiSelesai}
              </span>
            </button>

            {isConfirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleHapus(record)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium whitespace-nowrap"
                >
                  {ID_TEXT.bimbingan.aksi.konfirmasiYa}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium whitespace-nowrap"
                >
                  {ID_TEXT.bimbingan.aksi.konfirmasiBatal}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => bukaFormEdit(record)}
                  aria-label={`${ID_TEXT.bimbingan.aksi.ubah}: ${record.topik}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(record.bimbinganId)}
                  aria-label={`${ID_TEXT.bimbingan.aksi.hapus}: ${record.topik}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        {record.ringkasan && (
          <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {record.ringkasan}
          </p>
        )}

        {record.tindakLanjut.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              {ID_TEXT.bimbingan.form.tindakLanjutLabel}
            </p>
            <ul className="divide-y divide-slate-100">
              {record.tindakLanjut.map((tl) => {
                const key = `${record.bimbinganId}:${tl.id}`;
                const isConverting = Boolean(convertingKeys[key]);
                const sudahDiRoadmap =
                  Boolean(tl.roadmapTugasId) && existingRoadmapTugasIds.has(tl.roadmapTugasId);

                return (
                  <li
                    key={tl.id}
                    className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => void handleToggleTindakLanjutItem(record, tl.id)}
                      className="min-h-[44px] flex items-center gap-3 text-left flex-1 min-w-0 group focus-visible:outline-2 focus-visible:outline-[#4F46E5] rounded-xl px-1"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          tl.selesai
                            ? 'bg-[#10B981] border-[#10B981] text-white'
                            : 'border-slate-300 bg-white group-hover:border-[#4F46E5]'
                        }`}
                      >
                        {tl.selesai && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </span>
                      <span
                        className={`text-base leading-snug ${
                          tl.selesai ? 'line-through text-slate-400' : 'text-[#0F172A]'
                        }`}
                      >
                        {tl.judul}
                      </span>
                    </button>

                    {sudahDiRoadmap ? (
                      <span className="min-h-[44px] px-3 py-1.5 text-sm font-medium text-[#10B981] inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{ID_TEXT.bimbingan.aksi.sudahDiRoadmap}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => void handleJadikanTugas(record, tl)}
                        className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-[#4F46E5] text-sm font-medium inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors disabled:opacity-60 self-start sm:self-center"
                      >
                        {isConverting ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                        ) : (
                          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {isConverting
                            ? ID_TEXT.bimbingan.aksi.jadikanTugasMemuat
                            : ID_TEXT.bimbingan.aksi.jadikanTugas}
                        </span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
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
            {ID_TEXT.bimbingan.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">{ID_TEXT.bimbingan.subjudul}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
          <PremiumGate
            feature="ekspor_ringkasan_bimbingan"
            label="Salin logbook"
            onAuthorized={() => void handleSalinLogbook()}
          />

          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.bimbingan.tombolTambahHeader.replace(/^\+\s*/, '')}</span>
          </button>
        </div>
      </header>

      {/* Ajakan ringan jika nama dosen belum diisi di Profil */}
      {belumAdaDospemDiProfil && (
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700">
            <Info className="w-4 h-4 text-[#4F46E5] shrink-0 mt-1" aria-hidden="true" />
            <span>{ID_TEXT.bimbingan.ajakanProfilDosen}</span>
          </div>
          <Link
            to="/profil"
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-[#4F46E5] text-sm font-semibold inline-flex items-center justify-center whitespace-nowrap self-end sm:self-center shrink-0 transition-colors"
          >
            {ID_TEXT.bimbingan.ajakanProfilLink}
          </Link>
        </div>
      )}

      {(error || aksiError) && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm sm:text-base text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{aksiError || ID_TEXT.bimbingan.errorMuat}</span>
        </div>
      )}

      {aksiPesan && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between gap-3 text-sm sm:text-base text-emerald-900"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" aria-hidden="true" />
            <span>{aksiPesan}</span>
          </div>
          <button
            type="button"
            onClick={() => setAksiPesan(null)}
            aria-label={ID_TEXT.app.tutup}
            className="min-h-[44px] min-w-[44px] rounded-xl text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Form Tambah / Ubah Bimbingan */}
      {formTerbuka && (
        <section
          aria-label={
            editingId ? ID_TEXT.bimbingan.form.judulEdit : ID_TEXT.bimbingan.form.judulTambah
          }
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {editingId ? ID_TEXT.bimbingan.form.judulEdit : ID_TEXT.bimbingan.form.judulTambah}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bimbingan-tanggal"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.bimbingan.form.tanggalLabel}
                </label>
                <input
                  id="bimbingan-tanggal"
                  type="datetime-local"
                  value={tanggalLocal}
                  onChange={(e) => setTanggalLocal(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{ID_TEXT.bimbingan.form.tanggalHint}</p>
              </div>

              <div>
                <label
                  htmlFor="bimbingan-dosen"
                  className="block text-sm font-medium text-[#0F172A] mb-1.5"
                >
                  {ID_TEXT.bimbingan.form.dosenLabel}
                </label>

                {(dospem1 || dospem2) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dospem1 && (
                      <button
                        type="button"
                        onClick={() => setDosen(dospem1)}
                        className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                          dosen === dospem1
                            ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {ID_TEXT.bimbingan.form.dosenPilihanPembimbing1(dospem1)}
                      </button>
                    )}
                    {dospem2 && (
                      <button
                        type="button"
                        onClick={() => setDosen(dospem2)}
                        className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                          dosen === dospem2
                            ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {ID_TEXT.bimbingan.form.dosenPilihanPembimbing2(dospem2)}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDosen('')}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                        dosen !== dospem1 && dosen !== dospem2
                          ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {ID_TEXT.bimbingan.form.dosenPilihanManual}
                    </button>
                  </div>
                )}

                <input
                  id="bimbingan-dosen"
                  type="text"
                  maxLength={BIMBINGAN_LIMITS.dosen}
                  value={dosen}
                  onChange={(e) => setDosen(e.target.value)}
                  placeholder={ID_TEXT.bimbingan.form.dosenPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bimbingan-topik"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                {ID_TEXT.bimbingan.form.topikLabel}
              </label>
              <input
                id="bimbingan-topik"
                type="text"
                maxLength={BIMBINGAN_LIMITS.topik}
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder={ID_TEXT.bimbingan.form.topikPlaceholder}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="bimbingan-ringkasan"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                {ID_TEXT.bimbingan.form.ringkasanLabel}
              </label>
              <textarea
                id="bimbingan-ringkasan"
                rows={3}
                maxLength={BIMBINGAN_LIMITS.ringkasan}
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder={ID_TEXT.bimbingan.form.ringkasanPlaceholder}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Tindak Lanjut */}
            <div className="space-y-2.5 pt-1">
              <label
                htmlFor="bimbingan-tindak-lanjut-input"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.bimbingan.form.tindakLanjutLabel}
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="bimbingan-tindak-lanjut-input"
                  type="text"
                  maxLength={BIMBINGAN_LIMITS.tindakLanjutJudul}
                  value={tindakLanjutInput}
                  onChange={(e) => setTindakLanjutInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTambahTindakLanjutDraft();
                    }
                  }}
                  placeholder={ID_TEXT.bimbingan.form.tindakLanjutPlaceholder}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-base text-[#0F172A] bg-white focus:border-[#4F46E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTambahTindakLanjutDraft}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#0F172A] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.bimbingan.form.tindakLanjutTambah}</span>
                </button>
              </div>

              {tindakLanjutError && <p className="text-sm text-rose-700">{tindakLanjutError}</p>}

              {tindakLanjutDraft.length === 0 ? (
                <p className="text-sm text-slate-500">{ID_TEXT.bimbingan.form.tindakLanjutKosong}</p>
              ) : (
                <ul className="space-y-1.5">
                  {tindakLanjutDraft.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2"
                    >
                      <span className="text-sm sm:text-base text-[#0F172A] min-w-0 break-words">
                        {item.judul}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleHapusTindakLanjutDraft(item.id)}
                        aria-label={`${ID_TEXT.bimbingan.form.tindakLanjutHapus}: ${item.judul}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="min-h-[44px] flex items-center gap-3 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={selesai}
                onChange={(e) => setSelesai(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
              />
              <span className="text-base text-[#0F172A]">
                {ID_TEXT.bimbingan.form.statusSelesaiLabel}
              </span>
            </label>

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
                {ID_TEXT.bimbingan.form.tombolBatal}
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center gap-2 disabled:opacity-60"
              >
                {savingForm && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>
                  {savingForm
                    ? ID_TEXT.bimbingan.form.tombolMenyimpan
                    : editingId
                      ? ID_TEXT.bimbingan.form.tombolSimpanEdit
                      : ID_TEXT.bimbingan.form.tombolSimpan}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Per Dosen */}
      {bimbinganList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="filter-dosen-bimbingan"
              className="text-sm font-medium text-slate-700 shrink-0"
            >
              {ID_TEXT.bimbingan.filterLabel}
            </label>
            <select
              id="filter-dosen-bimbingan"
              value={filterDosen}
              onChange={(e) => setFilterDosen(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="ALL">{ID_TEXT.bimbingan.filterSemuaDosen}</option>
              {daftarDosenUnik.map((nama) => (
                <option key={nama} value={nama}>
                  {nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Empty State atau Daftar Bimbingan */}
      {bimbinganList.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10 text-center max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
            <MessageSquareText className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-2">
            {ID_TEXT.bimbingan.emptyJudul}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
            {ID_TEXT.bimbingan.emptyDeskripsi}
          </p>
          <button
            type="button"
            onClick={bukaFormTambah}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
          >
            {ID_TEXT.bimbingan.emptyTombol}
          </button>
        </section>
      ) : bimbinganTersaring.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center space-y-2">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            {ID_TEXT.bimbingan.filterKosongJudul}
          </h2>
          <p className="text-base text-slate-600">{ID_TEXT.bimbingan.filterKosongDeskripsi}</p>
        </section>
      ) : (
        <div className="space-y-8">
          {/* Bagian Akan Datang */}
          <section aria-labelledby="heading-akan-datang" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="heading-akan-datang" className="text-lg font-semibold text-[#0F172A]">
                {ID_TEXT.bimbingan.bagianAkanDatang} ({akanDatang.length})
              </h2>
            </div>

            {akanDatang.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-base text-slate-600">
                {ID_TEXT.bimbingan.kosongAkanDatang}
              </div>
            ) : (
              <div className="space-y-4">{akanDatang.map(renderBimbinganCard)}</div>
            )}
          </section>

          {/* Bagian Riwayat */}
          <section aria-labelledby="heading-riwayat" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="heading-riwayat" className="text-lg font-semibold text-[#0F172A]">
                {ID_TEXT.bimbingan.bagianRiwayat} ({riwayat.length})
              </h2>
            </div>

            {riwayat.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-base text-slate-600">
                {ID_TEXT.bimbingan.kosongRiwayat}
              </div>
            ) : (
              <div className="space-y-4">{riwayat.map(renderBimbinganCard)}</div>
            )}
          </section>
        </div>
      )}

      {/* Undo Toast Hapus Bimbingan */}
      {undoRecord && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F172A] text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-sm leading-snug truncate">
            {ID_TEXT.bimbingan.aksi.undoPesan(undoRecord.topik)}
          </p>
          <button
            type="button"
            onClick={() => void handleUndoHapus()}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{ID_TEXT.bimbingan.aksi.undoTombol}</span>
          </button>
        </div>
      )}
    </div>
  );
}
