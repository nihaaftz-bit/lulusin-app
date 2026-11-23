import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Check, Loader2 } from 'lucide-react';
import { UniversitasAutocomplete } from '../components/UniversitasAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import {
  FIELD_LIMITS,
  JENIS_PENELITIAN_OPTIONS,
  SEMESTER_OPTIONS,
  type JenisPenelitian,
} from '../types/user';

interface FormErrors {
  namaLengkap?: string;
  universitas?: string;
  fakultas?: string;
  prodi?: string;
  judulSkripsi?: string;
  jenisPenelitian?: string;
  dosenPembimbing1?: string;
  dosenPembimbing2?: string;
}

export function OnboardingPage() {
  const { firebaseUser, profile, simpanOnboarding, keluar } = useAuth();
  const [langkah, setLangkah] = useState<1 | 2>(1);

  const [namaLengkap, setNamaLengkap] = useState(
    profile?.namaLengkap || firebaseUser?.displayName || ''
  );
  const [universitas, setUniversitas] = useState(profile?.universitas || '');
  const [fakultas, setFakultas] = useState(profile?.fakultas || '');
  const [prodi, setProdi] = useState(profile?.prodi || '');
  const [semester, setSemester] = useState(profile?.semester || '');

  const [judulSkripsi, setJudulSkripsi] = useState(profile?.judulSkripsi || '');
  const [belumAdaJudul, setBelumAdaJudul] = useState(false);
  const [jenisPenelitian, setJenisPenelitian] = useState<JenisPenelitian | ''>(
    profile?.jenisPenelitian || ''
  );
  const [dosenPembimbing1, setDosenPembimbing1] = useState(profile?.dosenPembimbing1 || '');
  const [dosenPembimbing2, setDosenPembimbing2] = useState(profile?.dosenPembimbing2 || '');
  const [targetSidang, setTargetSidang] = useState(profile?.targetSidang || '');

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validasiLayar1(includeOpsional: boolean): boolean {
    const nextErrors: FormErrors = {};
    const namaTrim = namaLengkap.trim();
    const univTrim = universitas.trim();
    const prodiTrim = prodi.trim();

    if (!namaTrim) {
      nextErrors.namaLengkap = ID_TEXT.onboarding.validasi.namaWajib;
    } else if (namaTrim.length > FIELD_LIMITS.namaLengkap) {
      nextErrors.namaLengkap = ID_TEXT.onboarding.validasi.namaTerlaluPanjang;
    }

    if (!univTrim) {
      nextErrors.universitas = ID_TEXT.onboarding.validasi.universitasWajib;
    } else if (univTrim.length > FIELD_LIMITS.universitas) {
      nextErrors.universitas = ID_TEXT.onboarding.validasi.universitasTerlaluPanjang;
    }

    if (!prodiTrim) {
      nextErrors.prodi = ID_TEXT.onboarding.validasi.prodiWajib;
    } else if (prodiTrim.length > FIELD_LIMITS.prodi) {
      nextErrors.prodi = ID_TEXT.onboarding.validasi.prodiTerlaluPanjang;
    }

    if (includeOpsional && fakultas.trim().length > FIELD_LIMITS.fakultas) {
      nextErrors.fakultas = ID_TEXT.onboarding.validasi.fakultasTerlaluPanjang;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validasiLayar2(includeOpsional: boolean): boolean {
    const nextErrors: FormErrors = {};

    if (!jenisPenelitian) {
      nextErrors.jenisPenelitian = ID_TEXT.onboarding.validasi.jenisWajib;
    }

    if (includeOpsional) {
      if (!belumAdaJudul && judulSkripsi.trim().length > FIELD_LIMITS.judulSkripsi) {
        nextErrors.judulSkripsi = ID_TEXT.onboarding.validasi.judulTerlaluPanjang;
      }
      if (dosenPembimbing1.trim().length > FIELD_LIMITS.dosenPembimbing1) {
        nextErrors.dosenPembimbing1 = ID_TEXT.onboarding.validasi.dospemTerlaluPanjang;
      }
      if (dosenPembimbing2.trim().length > FIELD_LIMITS.dosenPembimbing2) {
        nextErrors.dosenPembimbing2 = ID_TEXT.onboarding.validasi.dospemTerlaluPanjang;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleLanjutLayar1(e: React.FormEvent) {
    e.preventDefault();
    if (!validasiLayar1(true)) return;
    setLangkah(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleLewatiLayar1() {
    if (!validasiLayar1(false)) return;
    setFakultas('');
    setSemester('');
    setLangkah(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function kirimOnboarding(lewatiOpsionalLayar2: boolean) {
    if (!validasiLayar2(!lewatiOpsionalLayar2)) return;
    if (!jenisPenelitian) return;

    setSubmitError(null);
    setSaving(true);
    try {
      await simpanOnboarding({
        namaLengkap: namaLengkap.trim(),
        universitas: universitas.trim(),
        fakultas: fakultas.trim(),
        prodi: prodi.trim(),
        semester,
        judulSkripsi: lewatiOpsionalLayar2 || belumAdaJudul ? '' : judulSkripsi.trim(),
        jenisPenelitian,
        dosenPembimbing1: lewatiOpsionalLayar2 ? '' : dosenPembimbing1.trim(),
        dosenPembimbing2: lewatiOpsionalLayar2 ? '' : dosenPembimbing2.trim(),
        targetSidang: lewatiOpsionalLayar2 ? '' : targetSidang,
      });
    } catch {
      setSubmitError(ID_TEXT.onboarding.validasi.errorSimpan);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmitLayar2(e: React.FormEvent) {
    e.preventDefault();
    void kirimOnboarding(false);
  }

  const progresPersen = langkah === 1 ? 50 : 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Header ringkas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight">{ID_TEXT.app.nama}</span>
          </div>

          <button
            type="button"
            onClick={() => void keluar()}
            className="min-h-[44px] px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#0F172A] rounded-xl hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {ID_TEXT.persetujuan.tombolKeluar}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600 tabular-nums">
            <span>{ID_TEXT.onboarding.langkahIndikator(langkah, 2)}</span>
            <span>{progresPersen}%</span>
          </div>
          <div
            className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progresPersen}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
              style={{ width: `${progresPersen}%` }}
            />
          </div>
        </div>

        {langkah === 1 ? (
          <form
            onSubmit={handleLanjutLayar1}
            noValidate
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5"
          >
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-[#0F172A]">
                {ID_TEXT.onboarding.layar1.judul}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                {ID_TEXT.onboarding.layar1.subjudul}
              </p>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-nama"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar1.namaLabel}{' '}
                <span className="text-rose-600 font-normal">*</span>
              </label>
              <input
                id="onboarding-nama"
                type="text"
                maxLength={FIELD_LIMITS.namaLengkap}
                value={namaLengkap}
                onChange={(e) => {
                  setNamaLengkap(e.target.value);
                  if (errors.namaLengkap) setErrors((p) => ({ ...p, namaLengkap: undefined }));
                }}
                placeholder={ID_TEXT.onboarding.layar1.namaPlaceholder}
                aria-invalid={Boolean(errors.namaLengkap)}
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.namaLengkap
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#4F46E5] focus:ring-indigo-100'
                }`}
              />
              {errors.namaLengkap && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.namaLengkap}
                </p>
              )}
            </div>

            {/* Universitas */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-universitas"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar1.universitasLabel}{' '}
                <span className="text-rose-600 font-normal">*</span>
              </label>
              <UniversitasAutocomplete
                id="onboarding-universitas"
                value={universitas}
                onChange={(val) => {
                  setUniversitas(val);
                  if (errors.universitas) setErrors((p) => ({ ...p, universitas: undefined }));
                }}
                error={errors.universitas}
              />
              <p className="text-xs text-slate-500">
                {ID_TEXT.onboarding.layar1.universitasHint}
              </p>
              {errors.universitas && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.universitas}
                </p>
              )}
            </div>

            {/* Program Studi / Jurusan */}
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-prodi"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar1.prodiLabel}{' '}
                <span className="text-rose-600 font-normal">*</span>
              </label>
              <input
                id="onboarding-prodi"
                type="text"
                maxLength={FIELD_LIMITS.prodi}
                value={prodi}
                onChange={(e) => {
                  setProdi(e.target.value);
                  if (errors.prodi) setErrors((p) => ({ ...p, prodi: undefined }));
                }}
                placeholder={ID_TEXT.onboarding.layar1.prodiPlaceholder}
                aria-invalid={Boolean(errors.prodi)}
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.prodi
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#4F46E5] focus:ring-indigo-100'
                }`}
              />
              {errors.prodi && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.prodi}
                </p>
              )}
            </div>

            {/* Fakultas (Opsional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="onboarding-fakultas"
                  className="block text-sm font-semibold text-[#0F172A]"
                >
                  {ID_TEXT.onboarding.layar1.fakultasLabel}
                </label>
                <span className="text-xs text-slate-500">
                  {ID_TEXT.onboarding.labelOpsional}
                </span>
              </div>
              <input
                id="onboarding-fakultas"
                type="text"
                maxLength={FIELD_LIMITS.fakultas}
                value={fakultas}
                onChange={(e) => setFakultas(e.target.value)}
                placeholder={ID_TEXT.onboarding.layar1.fakultasPlaceholder}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              />
              {errors.fakultas && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.fakultas}
                </p>
              )}
            </div>

            {/* Semester (Opsional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="onboarding-semester"
                  className="block text-sm font-semibold text-[#0F172A]"
                >
                  {ID_TEXT.onboarding.layar1.semesterLabel}
                </label>
                <span className="text-xs text-slate-500">
                  {ID_TEXT.onboarding.labelOpsional}
                </span>
              </div>
              <select
                id="onboarding-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">{ID_TEXT.onboarding.layar1.semesterPlaceholder}</option>
                {SEMESTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Lebih dari 14'
                      ? ID_TEXT.onboarding.layar1.semesterOpsiLebih
                      : `${ID_TEXT.onboarding.layar1.semesterPrefix} ${opt}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="submit"
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.onboarding.tombolLanjut}
              </button>
              <button
                type="button"
                onClick={handleLewatiLayar1}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.onboarding.tombolLewati}
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleSubmitLayar2}
            noValidate
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setLangkah(1);
                }}
                className="min-h-[44px] -ml-2 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{ID_TEXT.onboarding.tombolKembali}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-[#0F172A]">
                {ID_TEXT.onboarding.layar2.judul}
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                {ID_TEXT.onboarding.layar2.subjudul}
              </p>
            </div>

            {/* Jenis Penelitian (Wajib) */}
            <fieldset className="space-y-2.5">
              <legend className="block text-sm font-semibold text-[#0F172A]">
                {ID_TEXT.onboarding.layar2.jenisPenelitianLabel}{' '}
                <span className="text-rose-600 font-normal">*</span>
              </legend>
              <p className="text-xs text-slate-500">
                {ID_TEXT.onboarding.layar2.jenisPenelitianHint}
              </p>
              <div className="space-y-2.5">
                {JENIS_PENELITIAN_OPTIONS.map((opsi) => {
                  const selected = jenisPenelitian === opsi;
                  const info = ID_TEXT.onboarding.layar2.jenisOpsi[opsi];
                  return (
                    <button
                      key={opsi}
                      type="button"
                      onClick={() => {
                        setJenisPenelitian(opsi);
                        if (errors.jenisPenelitian) {
                          setErrors((p) => ({ ...p, jenisPenelitian: undefined }));
                        }
                      }}
                      aria-pressed={selected}
                      className={`w-full min-h-[44px] p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                        selected
                          ? 'border-[#4F46E5] bg-indigo-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-[#0F172A]">{info.judul}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{info.penjelasan}</p>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.jenisPenelitian && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.jenisPenelitian}
                </p>
              )}
            </fieldset>

            {/* Judul Skripsi Sementara (Opsional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="onboarding-judul"
                  className="block text-sm font-semibold text-[#0F172A]"
                >
                  {ID_TEXT.onboarding.layar2.judulSkripsiLabel}
                </label>
                <span className="text-xs text-slate-500">
                  {ID_TEXT.onboarding.labelOpsional}
                </span>
              </div>
              <textarea
                id="onboarding-judul"
                rows={2}
                maxLength={FIELD_LIMITS.judulSkripsi}
                disabled={belumAdaJudul}
                value={belumAdaJudul ? '' : judulSkripsi}
                onChange={(e) => setJudulSkripsi(e.target.value)}
                placeholder={ID_TEXT.onboarding.layar2.judulSkripsiPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <label className="min-h-[44px] inline-flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={belumAdaJudul}
                  onChange={(e) => {
                    setBelumAdaJudul(e.target.checked);
                    if (e.target.checked) setJudulSkripsi('');
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span className="text-sm text-slate-700">
                  {ID_TEXT.onboarding.layar2.belumAdaJudulCheckbox}
                </span>
              </label>
              {errors.judulSkripsi && (
                <p className="text-sm text-rose-700" role="alert">
                  {errors.judulSkripsi}
                </p>
              )}
            </div>

            {/* Dosen Pembimbing 1 & 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="onboarding-dospem1"
                    className="block text-sm font-semibold text-[#0F172A]"
                  >
                    {ID_TEXT.onboarding.layar2.dospem1Label}
                  </label>
                  <span className="text-xs text-slate-500">
                    {ID_TEXT.onboarding.labelOpsional}
                  </span>
                </div>
                <input
                  id="onboarding-dospem1"
                  type="text"
                  maxLength={FIELD_LIMITS.dosenPembimbing1}
                  value={dosenPembimbing1}
                  onChange={(e) => setDosenPembimbing1(e.target.value)}
                  placeholder={ID_TEXT.onboarding.layar2.dospem1Placeholder}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="onboarding-dospem2"
                    className="block text-sm font-semibold text-[#0F172A]"
                  >
                    {ID_TEXT.onboarding.layar2.dospem2Label}
                  </label>
                  <span className="text-xs text-slate-500">
                    {ID_TEXT.onboarding.labelOpsional}
                  </span>
                </div>
                <input
                  id="onboarding-dospem2"
                  type="text"
                  maxLength={FIELD_LIMITS.dosenPembimbing2}
                  value={dosenPembimbing2}
                  onChange={(e) => setDosenPembimbing2(e.target.value)}
                  placeholder={ID_TEXT.onboarding.layar2.dospem2Placeholder}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Target Sidang */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="onboarding-target-sidang"
                  className="block text-sm font-semibold text-[#0F172A]"
                >
                  {ID_TEXT.onboarding.layar2.targetSidangLabel}
                </label>
                <span className="text-xs text-slate-500">
                  {ID_TEXT.onboarding.labelOpsional}
                </span>
              </div>
              <input
                id="onboarding-target-sidang"
                type="date"
                value={targetSidang}
                onChange={(e) => setTargetSidang(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 tabular-nums"
              />
              <p className="text-xs text-slate-500">
                {ID_TEXT.onboarding.layar2.targetSidangHint}
              </p>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
              >
                <AlertCircle
                  className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />}
                <span>
                  {saving ? ID_TEXT.onboarding.tombolMenyimpan : ID_TEXT.onboarding.tombolSelesai}
                </span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void kirimOnboarding(true)}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base transition-colors disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.onboarding.tombolLewati}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
