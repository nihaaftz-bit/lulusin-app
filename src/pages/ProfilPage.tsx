import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { UniversitasAutocomplete } from '../components/UniversitasAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { formatWaktuIndonesia } from '../lib/date';
import {
  FIELD_LIMITS,
  JENIS_PENELITIAN_OPTIONS,
  SEMESTER_OPTIONS,
  type JenisPenelitian,
} from '../types/user';

interface ProfilErrors {
  namaLengkap?: string;
  universitas?: string;
  fakultas?: string;
  prodi?: string;
  judulSkripsi?: string;
  jenisPenelitian?: string;
  dosenPembimbing1?: string;
  dosenPembimbing2?: string;
}

export function ProfilPage() {
  const { profile, perbaruiProfil } = useAuth();

  const [namaLengkap, setNamaLengkap] = useState(profile?.namaLengkap || '');
  const [universitas, setUniversitas] = useState(profile?.universitas || '');
  const [fakultas, setFakultas] = useState(profile?.fakultas || '');
  const [prodi, setProdi] = useState(profile?.prodi || '');
  const [semester, setSemester] = useState(profile?.semester || '');
  const [judulSkripsi, setJudulSkripsi] = useState(profile?.judulSkripsi || '');
  const [belumAdaJudul, setBelumAdaJudul] = useState(!profile?.judulSkripsi);
  const [jenisPenelitian, setJenisPenelitian] = useState<JenisPenelitian | ''>(
    profile?.jenisPenelitian || ''
  );
  const [dosenPembimbing1, setDosenPembimbing1] = useState(profile?.dosenPembimbing1 || '');
  const [dosenPembimbing2, setDosenPembimbing2] = useState(profile?.dosenPembimbing2 || '');
  const [targetSidang, setTargetSidang] = useState(profile?.targetSidang || '');

  const [errors, setErrors] = useState<ProfilErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setNamaLengkap(profile.namaLengkap);
    setUniversitas(profile.universitas);
    setFakultas(profile.fakultas);
    setProdi(profile.prodi);
    setSemester(profile.semester);
    setJudulSkripsi(profile.judulSkripsi);
    setBelumAdaJudul(!profile.judulSkripsi);
    setJenisPenelitian(profile.jenisPenelitian);
    setDosenPembimbing1(profile.dosenPembimbing1);
    setDosenPembimbing2(profile.dosenPembimbing2);
    setTargetSidang(profile.targetSidang);
  }, [profile]);

  const jenisBerubah =
    Boolean(profile?.jenisPenelitian) &&
    Boolean(jenisPenelitian) &&
    profile?.jenisPenelitian !== jenisPenelitian;

  function validasi(): boolean {
    const nextErrors: ProfilErrors = {};
    if (!namaLengkap.trim()) {
      nextErrors.namaLengkap = ID_TEXT.onboarding.validasi.namaWajib;
    } else if (namaLengkap.trim().length > FIELD_LIMITS.namaLengkap) {
      nextErrors.namaLengkap = ID_TEXT.onboarding.validasi.namaTerlaluPanjang;
    }

    if (!universitas.trim()) {
      nextErrors.universitas = ID_TEXT.onboarding.validasi.universitasWajib;
    } else if (universitas.trim().length > FIELD_LIMITS.universitas) {
      nextErrors.universitas = ID_TEXT.onboarding.validasi.universitasTerlaluPanjang;
    }

    if (!prodi.trim()) {
      nextErrors.prodi = ID_TEXT.onboarding.validasi.prodiWajib;
    } else if (prodi.trim().length > FIELD_LIMITS.prodi) {
      nextErrors.prodi = ID_TEXT.onboarding.validasi.prodiTerlaluPanjang;
    }

    if (fakultas.trim().length > FIELD_LIMITS.fakultas) {
      nextErrors.fakultas = ID_TEXT.onboarding.validasi.fakultasTerlaluPanjang;
    }

    if (!jenisPenelitian) {
      nextErrors.jenisPenelitian = ID_TEXT.onboarding.validasi.jenisWajib;
    }

    if (!belumAdaJudul && judulSkripsi.trim().length > FIELD_LIMITS.judulSkripsi) {
      nextErrors.judulSkripsi = ID_TEXT.onboarding.validasi.judulTerlaluPanjang;
    }

    if (dosenPembimbing1.trim().length > FIELD_LIMITS.dosenPembimbing1) {
      nextErrors.dosenPembimbing1 = ID_TEXT.onboarding.validasi.dospemTerlaluPanjang;
    }

    if (dosenPembimbing2.trim().length > FIELD_LIMITS.dosenPembimbing2) {
      nextErrors.dosenPembimbing2 = ID_TEXT.onboarding.validasi.dospemTerlaluPanjang;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validasi() || !jenisPenelitian) return;

    setSubmitError(null);
    setSavedIndicator(false);
    setSaving(true);
    try {
      await perbaruiProfil({
        namaLengkap: namaLengkap.trim(),
        universitas: universitas.trim(),
        fakultas: fakultas.trim(),
        prodi: prodi.trim(),
        semester,
        judulSkripsi: belumAdaJudul ? '' : judulSkripsi.trim(),
        jenisPenelitian,
        dosenPembimbing1: dosenPembimbing1.trim(),
        dosenPembimbing2: dosenPembimbing2.trim(),
        targetSidang,
      });
      setSavedIndicator(true);
    } catch {
      setSubmitError(ID_TEXT.profil.errorSimpan);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            {ID_TEXT.profil.judul}
          </h1>
          <p className="text-base text-slate-600">{ID_TEXT.profil.subjudul}</p>
        </div>

        {savedIndicator && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.profil.indikatorTersimpan}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Bagian 1: Data Diri & Kampus */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#0F172A] pb-3 border-b border-slate-100">
            {ID_TEXT.profil.bagianAkun}
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="profil-nama" className="block text-sm font-semibold text-[#0F172A]">
              {ID_TEXT.onboarding.layar1.namaLabel}{' '}
              <span className="text-rose-600 font-normal">*</span>
            </label>
            <input
              id="profil-nama"
              type="text"
              maxLength={FIELD_LIMITS.namaLengkap}
              value={namaLengkap}
              onChange={(e) => {
                setNamaLengkap(e.target.value);
                setSavedIndicator(false);
                if (errors.namaLengkap) setErrors((p) => ({ ...p, namaLengkap: undefined }));
              }}
              placeholder={ID_TEXT.onboarding.layar1.namaPlaceholder}
              aria-invalid={Boolean(errors.namaLengkap)}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border bg-white text-base text-[#0F172A] focus:outline-none focus:ring-2 ${
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

          <div className="space-y-1.5">
            <label
              htmlFor="profil-universitas"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              {ID_TEXT.onboarding.layar1.universitasLabel}{' '}
              <span className="text-rose-600 font-normal">*</span>
            </label>
            <UniversitasAutocomplete
              id="profil-universitas"
              value={universitas}
              onChange={(val) => {
                setUniversitas(val);
                setSavedIndicator(false);
                if (errors.universitas) setErrors((p) => ({ ...p, universitas: undefined }));
              }}
              error={errors.universitas}
            />
            {errors.universitas && (
              <p className="text-sm text-rose-700" role="alert">
                {errors.universitas}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="profil-prodi"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar1.prodiLabel}{' '}
                <span className="text-rose-600 font-normal">*</span>
              </label>
              <input
                id="profil-prodi"
                type="text"
                maxLength={FIELD_LIMITS.prodi}
                value={prodi}
                onChange={(e) => {
                  setProdi(e.target.value);
                  setSavedIndicator(false);
                  if (errors.prodi) setErrors((p) => ({ ...p, prodi: undefined }));
                }}
                placeholder={ID_TEXT.onboarding.layar1.prodiPlaceholder}
                aria-invalid={Boolean(errors.prodi)}
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border bg-white text-base text-[#0F172A] focus:outline-none focus:ring-2 ${
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

            <div className="space-y-1.5">
              <label
                htmlFor="profil-fakultas"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar1.fakultasLabel}
              </label>
              <input
                id="profil-fakultas"
                type="text"
                maxLength={FIELD_LIMITS.fakultas}
                value={fakultas}
                onChange={(e) => {
                  setFakultas(e.target.value);
                  setSavedIndicator(false);
                }}
                placeholder={ID_TEXT.onboarding.layar1.fakultasPlaceholder}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profil-semester"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              {ID_TEXT.onboarding.layar1.semesterLabel}
            </label>
            <select
              id="profil-semester"
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setSavedIndicator(false);
              }}
              className="w-full sm:max-w-xs min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
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
        </section>

        {/* Bagian 2: Detail Skripsi */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#0F172A] pb-3 border-b border-slate-100">
            {ID_TEXT.profil.bagianSkripsi}
          </h2>

          <fieldset className="space-y-2.5">
            <legend className="block text-sm font-semibold text-[#0F172A]">
              {ID_TEXT.onboarding.layar2.jenisPenelitianLabel}{' '}
              <span className="text-rose-600 font-normal">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {JENIS_PENELITIAN_OPTIONS.map((opsi) => {
                const selected = jenisPenelitian === opsi;
                const info = ID_TEXT.onboarding.layar2.jenisOpsi[opsi];
                return (
                  <button
                    key={opsi}
                    type="button"
                    onClick={() => {
                      setJenisPenelitian(opsi);
                      setSavedIndicator(false);
                      if (errors.jenisPenelitian) {
                        setErrors((p) => ({ ...p, jenisPenelitian: undefined }));
                      }
                    }}
                    aria-pressed={selected}
                    className={`min-h-[44px] p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                      selected
                        ? 'border-[#4F46E5] bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-[#0F172A]">{info.judul}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          selected
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {selected && <Check className="w-3 h-3" />}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{info.penjelasan}</p>
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

          {jenisBerubah && (
            <div
              role="status"
              className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
            >
              <AlertTriangle
                className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <p className="font-semibold">{ID_TEXT.profil.peringatanJenisPenelitianJudul}</p>
                <p className="leading-relaxed">{ID_TEXT.profil.peringatanJenisPenelitianIsi}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="profil-judul" className="block text-sm font-semibold text-[#0F172A]">
              {ID_TEXT.onboarding.layar2.judulSkripsiLabel}
            </label>
            <textarea
              id="profil-judul"
              rows={2}
              maxLength={FIELD_LIMITS.judulSkripsi}
              disabled={belumAdaJudul}
              value={belumAdaJudul ? '' : judulSkripsi}
              onChange={(e) => {
                setJudulSkripsi(e.target.value);
                setSavedIndicator(false);
              }}
              placeholder={ID_TEXT.onboarding.layar2.judulSkripsiPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
            />
            <label className="min-h-[44px] inline-flex items-center gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={belumAdaJudul}
                onChange={(e) => {
                  setBelumAdaJudul(e.target.checked);
                  if (e.target.checked) setJudulSkripsi('');
                  setSavedIndicator(false);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="profil-dospem1"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar2.dospem1Label}
              </label>
              <input
                id="profil-dospem1"
                type="text"
                maxLength={FIELD_LIMITS.dosenPembimbing1}
                value={dosenPembimbing1}
                onChange={(e) => {
                  setDosenPembimbing1(e.target.value);
                  setSavedIndicator(false);
                }}
                placeholder={ID_TEXT.onboarding.layar2.dospem1Placeholder}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profil-dospem2"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                {ID_TEXT.onboarding.layar2.dospem2Label}
              </label>
              <input
                id="profil-dospem2"
                type="text"
                maxLength={FIELD_LIMITS.dosenPembimbing2}
                value={dosenPembimbing2}
                onChange={(e) => {
                  setDosenPembimbing2(e.target.value);
                  setSavedIndicator(false);
                }}
                placeholder={ID_TEXT.onboarding.layar2.dospem2Placeholder}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profil-target-sidang"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              {ID_TEXT.onboarding.layar2.targetSidangLabel}
            </label>
            <input
              id="profil-target-sidang"
              type="date"
              value={targetSidang}
              onChange={(e) => {
                setTargetSidang(e.target.value);
                setSavedIndicator(false);
              }}
              className="w-full sm:max-w-xs min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-base text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 tabular-nums"
            />
          </div>
        </section>

        {/* Bagian 3: Informasi Akun (Read-only) */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A] pb-3 border-b border-slate-100">
            {ID_TEXT.profil.bagianInfoAkun}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">{ID_TEXT.profil.emailLabel}</p>
              <p className="text-base font-medium text-[#0F172A] mt-0.5 break-all">
                {profile?.email || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">{ID_TEXT.profil.persetujuanLabel}</p>
              <p className="text-base font-medium text-[#0F172A] mt-0.5">
                {profile?.persetujuanAt
                  ? ID_TEXT.profil.persetujuanFormat(
                      profile.persetujuanVersi,
                      formatWaktuIndonesia(profile.persetujuanAt)
                    )
                  : '-'}
              </p>
            </div>
          </div>
        </section>

        {submitError && (
          <div
            role="alert"
            className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-2.5 text-sm text-amber-900"
          >
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />}
            <span>{saving ? ID_TEXT.profil.tombolMenyimpan : ID_TEXT.profil.tombolSimpan}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
