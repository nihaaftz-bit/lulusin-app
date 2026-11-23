import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  MessageSquarePlus,
  Send,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import {
  eksporSemuaDataPengguna,
  FEEDBACK_KATEGORI_OPTIONS,
  FEEDBACK_LIMITS,
  kirimMasukanPenguji,
  type FeedbackKategori,
} from '../lib/accountData';

export function PengaturanPage() {
  const { firebaseUser, hapusAkunPermanen } = useAuth();
  const location = useLocation();
  const uid = firebaseUser?.uid ?? '';

  // State Unduh Data JSON
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');

  // State Kirim Masukan
  const [kategori, setKategori] = useState<FeedbackKategori>(FEEDBACK_KATEGORI_OPTIONS[0]);
  const [halaman, setHalaman] = useState('');
  const [pesan, setPesan] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // State Hapus Akun 2 Langkah
  const [konfirmasiTerbuka, setKonfirmasiTerbuka] = useState(false);
  const [sudahCentangHapus, setSudahCentangHapus] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (location.hash === '#masukan') {
      const el = document.getElementById('masukan');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  async function handleUnduhData() {
    if (!uid) return;
    setExportError('');
    setExportSuccess('');
    setExportLoading(true);

    try {
      const exported = await eksporSemuaDataPengguna(uid);
      const jsonString = JSON.stringify(exported, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const tanggal = new Date().toISOString().slice(0, 10);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lulusin-data-skripsi-${tanggal}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      const ringkasan = [
        exported.profil ? '1 profil' : '0 profil',
        `${exported.roadmapTahap.length} tahap`,
        `${exported.roadmapTugas.length} tugas`,
        `${exported.bimbingan.length} bimbingan`,
        `${exported.revisi.length} revisi`,
        `${exported.referensi.length} referensi`,
      ].join(', ');
      setExportSuccess(ID_TEXT.pengaturan.unduhKartu.sukses(ringkasan));
    } catch {
      setExportError(ID_TEXT.pengaturan.unduhKartu.error);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleKirimMasukan(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;

    const pesanTrim = pesan.trim();
    if (!pesanTrim) {
      setFeedbackError(ID_TEXT.pengaturan.masukanKartu.validasiWajib);
      setFeedbackSuccess('');
      return;
    }
    if (pesanTrim.length > FEEDBACK_LIMITS.pesan) {
      setFeedbackError(ID_TEXT.pengaturan.masukanKartu.validasiPanjang);
      setFeedbackSuccess('');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setFeedbackLoading(true);
    try {
      await kirimMasukanPenguji(uid, {
        kategori,
        halaman,
        pesan: pesanTrim,
      });
      setPesan('');
      setHalaman('');
      setFeedbackSuccess(ID_TEXT.pengaturan.masukanKartu.sukses);
    } catch {
      setFeedbackError(ID_TEXT.pengaturan.masukanKartu.error);
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function handleHapusAkun() {
    if (!sudahCentangHapus) {
      setDeleteError(ID_TEXT.pengaturan.hapusKartu.errorBelumCentang);
      return;
    }

    setDeleteError('');
    setDeleteLoading(true);
    try {
      const { error } = await hapusAkunPermanen();
      if (error) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          setDeleteError(ID_TEXT.pengaturan.hapusKartu.errorReauthDitutup);
        } else if (error.code === 'auth/popup-blocked') {
          setDeleteError(ID_TEXT.pengaturan.hapusKartu.errorPopupDiblokir);
        } else {
          setDeleteError(error.message || ID_TEXT.pengaturan.hapusKartu.errorUmum);
        }
      }
    } catch {
      setDeleteError(ID_TEXT.pengaturan.hapusKartu.errorUmum);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          {ID_TEXT.pengaturan.judul}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">{ID_TEXT.pengaturan.subjudul}</p>
      </header>

      {/* 1. Tautan ke Profil */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.pengaturan.profilKartu.judul}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.pengaturan.profilKartu.deskripsi}
            </p>
          </div>
        </div>

        <Link
          to="/profil"
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base inline-flex items-center justify-center transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        >
          {ID_TEXT.pengaturan.profilKartu.tombol}
        </Link>
      </section>

      {/* 2. Unduh Data Saya (JSON) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.pengaturan.unduhKartu.judul}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.pengaturan.unduhKartu.deskripsi}
            </p>
          </div>
        </div>

        {exportSuccess && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-sm text-emerald-900"
          >
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {exportError && (
          <div
            role="alert"
            className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
          >
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{exportError}</span>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={handleUnduhData}
            disabled={exportLoading}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {exportLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.pengaturan.unduhKartu.tombolMemuat}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.pengaturan.unduhKartu.tombol}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 3. Kirim Masukan */}
      <section
        id="masukan"
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.pengaturan.masukanKartu.judul}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.pengaturan.masukanKartu.deskripsi}
            </p>
          </div>
        </div>

        <form onSubmit={handleKirimMasukan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="feedback-kategori"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.pengaturan.masukanKartu.kategoriLabel}
              </label>
              <select
                id="feedback-kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value as FeedbackKategori)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-2 focus:outline-offset-0 focus:outline-[#4F46E5]"
              >
                {FEEDBACK_KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="feedback-halaman"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.pengaturan.masukanKartu.halamanLabel}
              </label>
              <input
                id="feedback-halaman"
                type="text"
                maxLength={FEEDBACK_LIMITS.halaman}
                value={halaman}
                onChange={(e) => setHalaman(e.target.value)}
                placeholder={ID_TEXT.pengaturan.masukanKartu.halamanPlaceholder}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-500 focus:outline-2 focus:outline-offset-0 focus:outline-[#4F46E5]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="feedback-pesan"
                className="block text-sm font-medium text-[#0F172A]"
              >
                {ID_TEXT.pengaturan.masukanKartu.pesanLabel}
              </label>
              <span className="text-xs text-slate-600 tabular-nums">
                {pesan.length}/{FEEDBACK_LIMITS.pesan}
              </span>
            </div>
            <textarea
              id="feedback-pesan"
              rows={4}
              maxLength={FEEDBACK_LIMITS.pesan}
              value={pesan}
              onChange={(e) => {
                setPesan(e.target.value);
                if (feedbackError) setFeedbackError('');
              }}
              placeholder={ID_TEXT.pengaturan.masukanKartu.pesanPlaceholder}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-500 focus:outline-2 focus:outline-offset-0 focus:outline-[#4F46E5]"
            />
          </div>

          {feedbackSuccess && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-sm text-emerald-900"
            >
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {feedbackError && (
            <div
              role="alert"
              className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
            >
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{feedbackError}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={feedbackLoading}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              {feedbackLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.pengaturan.masukanKartu.tombolMengirim}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.pengaturan.masukanKartu.tombolKirim}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 4. Hapus Akun dan Semua Data */}
      <section className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.pengaturan.hapusKartu.judul}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.pengaturan.hapusKartu.deskripsi}
            </p>
          </div>
        </div>

        {!konfirmasiTerbuka ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setKonfirmasiTerbuka(true);
                setDeleteError('');
                setSudahCentangHapus(false);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.pengaturan.hapusKartu.tombolLangkah1}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-5 space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-rose-950">
                {ID_TEXT.pengaturan.hapusKartu.konfirmasiJudul}
              </h3>
              <p className="text-sm sm:text-base text-rose-900 leading-relaxed">
                {ID_TEXT.pengaturan.hapusKartu.konfirmasiPenjelasan}
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer min-h-[44px] py-1">
              <input
                type="checkbox"
                checked={sudahCentangHapus}
                onChange={(e) => {
                  setSudahCentangHapus(e.target.checked);
                  if (deleteError) setDeleteError('');
                }}
                className="mt-1 w-5 h-5 rounded border-rose-300 text-rose-700 focus:ring-rose-600 shrink-0"
              />
              <span className="text-sm sm:text-base text-rose-950 leading-snug">
                {ID_TEXT.pengaturan.hapusKartu.konfirmasiCheckbox}
              </span>
            </label>

            {deleteError && (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
              >
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleHapusAkun}
                disabled={deleteLoading}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                    <span>{ID_TEXT.pengaturan.hapusKartu.tombolMemuat}</span>
                  </>
                ) : (
                  <span>{ID_TEXT.pengaturan.hapusKartu.tombolLangkah2}</span>
                )}
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setKonfirmasiTerbuka(false);
                  setSudahCentangHapus(false);
                  setDeleteError('');
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base transition-colors disabled:opacity-70"
              >
                {ID_TEXT.pengaturan.hapusKartu.tombolBatal}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
