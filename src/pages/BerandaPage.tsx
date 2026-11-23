import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { UpgradeBanner } from '../components/UpgradeBanner';
import { useAuth } from '../contexts/AuthContext';
import { useBimbinganRevisi } from '../contexts/BimbinganRevisiContext';
import { useRoadmap } from '../contexts/RoadmapContext';
import { ID_TEXT } from '../i18n/id';
import {
  formatTanggalIndonesia,
  formatTanggalSingkat,
  formatWaktuIndonesia,
} from '../lib/date';
import {
  ambilFieldProfilKosong,
  ambilTenggatMendatang,
  cariTahapAktif,
  hitungMundurSidang,
  hitungProgresSkripsi,
  pilihLangkahBerikutnya,
} from '../lib/skripsiLogic';

export function BerandaPage() {
  const { firebaseUser, profile } = useAuth();
  const { tahapList, tugasList, loading: roadmapLoading, error: roadmapError } = useRoadmap();
  const {
    bimbinganList,
    revisiList,
    loading: brLoading,
    error: brError,
  } = useBimbinganRevisi();
  const [lengkapiDitutup, setLengkapiDitutup] = useState(false);
  const [turSelesai, setTurSelesai] = useState(true);
  const [langkahTur, setLangkahTur] = useState(0);

  const loading = roadmapLoading || brLoading;
  const error = roadmapError || brError;

  const uid = firebaseUser?.uid ?? '';
  useEffect(() => {
    if (!uid || typeof window === 'undefined') return;
    const saved = window.sessionStorage.getItem(`lulusin_tutup_lengkapi_${uid}`);
    setLengkapiDitutup(saved === '1');
    const savedTur = window.localStorage.getItem(`lulusin_tur_beranda_${uid}`);
    setTurSelesai(savedTur === '1');
    setLangkahTur(0);
  }, [uid]);

  function tutupKartuLengkapi() {
    setLengkapiDitutup(true);
    if (uid && typeof window !== 'undefined') {
      window.sessionStorage.setItem(`lulusin_tutup_lengkapi_${uid}`, '1');
    }
  }

  function selesaikanTur() {
    setTurSelesai(true);
    if (uid && typeof window !== 'undefined') {
      window.localStorage.setItem(`lulusin_tur_beranda_${uid}`, '1');
    }
  }

  function lanjutTur() {
    const totalLangkah = ID_TEXT.turBeranda.langkah.length;
    if (langkahTur + 1 >= totalLangkah) {
      selesaikanTur();
    } else {
      setLangkahTur((prev) => prev + 1);
    }
  }

  const namaDepan =
    profile?.namaLengkap?.trim().split(/\s+/)[0] || ID_TEXT.menuProfil.penggunaDefault;

  const metaParts = [
    profile?.universitas,
    profile?.prodi,
    profile?.jenisPenelitian ? `Penelitian ${profile.jenisPenelitian}` : '',
  ].filter(Boolean);

  const progres = useMemo(
    () => hitungProgresSkripsi(tahapList, tugasList),
    [tahapList, tugasList]
  );

  const tahapAktif = useMemo(
    () => cariTahapAktif(tahapList, tugasList),
    [tahapList, tugasList]
  );

  const langkahBerikutnya = useMemo(() => {
    const dospem1 = profile?.dosenPembimbing1?.trim() || '';
    const dospem2 = profile?.dosenPembimbing2?.trim() || '';

    return pilihLangkahBerikutnya({
      tahapList,
      tugasList,
      bimbinganList: bimbinganList.map((item) => ({
        id: item.bimbinganId,
        judul: item.topik,
        dosen: item.dosen,
        tanggalIso: item.tanggalIso,
        selesai: item.selesai,
      })),
      revisiList: revisiList.map((item) => {
        const namaTersimpan = item.sumberNama.trim();
        let sumberLabel: string = item.sumberKategori;
        if (namaTersimpan) {
          sumberLabel =
            item.sumberKategori === 'Lainnya'
              ? namaTersimpan
              : `${item.sumberKategori} · ${namaTersimpan}`;
        } else if (item.sumberKategori === 'Pembimbing 1' && dospem1) {
          sumberLabel = `Pembimbing 1 · ${dospem1}`;
        } else if (item.sumberKategori === 'Pembimbing 2' && dospem2) {
          sumberLabel = `Pembimbing 2 · ${dospem2}`;
        }
        return {
          id: item.revisiId,
          judul: item.isi,
          sumber: sumberLabel,
          prioritas: item.prioritas,
          tenggat: item.tenggat,
          selesai: item.status === 'Selesai',
        };
      }),
    });
  }, [
    tahapList,
    tugasList,
    bimbinganList,
    revisiList,
    profile?.dosenPembimbing1,
    profile?.dosenPembimbing2,
  ]);

  const tenggatMendatang = useMemo(
    () => ambilTenggatMendatang(tahapList, tugasList),
    [tahapList, tugasList]
  );

  const hitungMundur = useMemo(
    () => hitungMundurSidang(profile?.targetSidang || ''),
    [profile?.targetSidang]
  );

  const fieldKosong = useMemo(() => ambilFieldProfilKosong(profile), [profile]);
  const tampilkanLengkapiProfil = fieldKosong.length > 0 && !lengkapiDitutup;
  const pesanLengkapiProfil =
    fieldKosong.length > 0 ? ID_TEXT.beranda.lengkapiProfilPesan[fieldKosong[0]] : '';

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={ID_TEXT.app.memuat}>
        <div className="space-y-2">
          <div className="h-8 w-52 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-40 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
          <div className="h-36 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sapaan Personal & Judul Skripsi */}
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          {ID_TEXT.beranda.sapaan(namaDepan)}
        </h1>

        {profile?.judulSkripsi ? (
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
            {profile.judulSkripsi}
          </p>
        ) : (
          <p className="text-base text-slate-600 leading-relaxed">
            {ID_TEXT.beranda.judulSkripsiBelumDiisi}
          </p>
        )}

        {metaParts.length > 0 && (
          <p className="text-sm text-slate-600 pt-0.5">{metaParts.join(' · ')}</p>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{ID_TEXT.beranda.gagalMemuat}</span>
        </div>
      )}

      {/* Tur singkat 3 langkah di Beranda (bisa dilewati) */}
      {!turSelesai && (
        <section
          aria-label={ID_TEXT.turBeranda.judul}
          className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4F46E5]">
                {ID_TEXT.turBeranda.indikator(langkahTur + 1, ID_TEXT.turBeranda.langkah.length)}
              </p>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                {ID_TEXT.turBeranda.langkah[langkahTur]?.judul}
              </h2>
            </div>

            <button
              type="button"
              onClick={selesaikanTur}
              className="min-h-[44px] px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-indigo-100/70 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              {ID_TEXT.turBeranda.tombolLewati}
            </button>
          </div>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {ID_TEXT.turBeranda.langkah[langkahTur]?.deskripsi}
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {ID_TEXT.turBeranda.langkah.map((item, idx) => (
                <span
                  key={item.judul}
                  className={`h-2 rounded-full transition-all ${
                    idx === langkahTur ? 'w-6 bg-[#4F46E5]' : 'w-2 bg-indigo-200'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={lanjutTur}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              <span>
                {langkahTur + 1 >= ID_TEXT.turBeranda.langkah.length
                  ? ID_TEXT.turBeranda.tombolSelesai
                  : ID_TEXT.turBeranda.tombolLanjut}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* Kartu "Lengkapi profilmu" (hanya tampil jika ada field opsional kosong dan belum ditutup) */}
      {tampilkanLengkapiProfil && (
        <section
          aria-label={ID_TEXT.beranda.lengkapiProfilJudul}
          className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-base font-semibold text-[#0F172A]">
                {ID_TEXT.beranda.lengkapiProfilJudul}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {pesanLengkapiProfil}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Link
              to="/profil"
              className="min-h-[44px] px-4 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-[#0F172A] font-medium text-sm sm:text-base inline-flex items-center justify-center transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              {ID_TEXT.beranda.lengkapiProfilTombol}
            </Link>
            <button
              type="button"
              onClick={tutupKartuLengkapi}
              aria-label={ID_TEXT.beranda.lengkapiProfilTutup}
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-[#0F172A] hover:bg-amber-100/70 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* Focal Anchor: Kartu "Langkah berikutnya" */}
      <section
        aria-label={ID_TEXT.beranda.langkahBerikutnyaLabel}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4F46E5]">
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ID_TEXT.beranda.langkahBerikutnyaLabel}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug text-balance">
              {langkahBerikutnya.judul}
            </h2>

            {langkahBerikutnya.jenis === 'roadmap_tenggat' && (
              <p className="text-base text-slate-600">
                {langkahBerikutnya.namaTahap}
                <span aria-hidden="true"> · </span>
                Tenggat {formatTanggalIndonesia(langkahBerikutnya.tenggat)}
              </p>
            )}

            {langkahBerikutnya.jenis === 'roadmap_tahap_aktif' && (
              <p className="text-base text-slate-600">
                Tahap {langkahBerikutnya.namaTahap}
              </p>
            )}

            {langkahBerikutnya.jenis === 'bimbingan' && (
              <p className="text-base text-slate-600">
                {formatWaktuIndonesia(langkahBerikutnya.tanggalIso)}
                {langkahBerikutnya.dosen ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{langkahBerikutnya.dosen}</span>
                  </>
                ) : null}
                <span aria-hidden="true"> · </span>
                <span>{langkahBerikutnya.keterangan}</span>
              </p>
            )}

            {langkahBerikutnya.jenis === 'revisi' && (
              <p className="text-base text-slate-600">
                {langkahBerikutnya.sumber ? (
                  <>
                    <span>{langkahBerikutnya.sumber}</span>
                    <span aria-hidden="true"> · </span>
                  </>
                ) : null}
                {langkahBerikutnya.tenggat ? (
                  <>
                    <span>Tenggat {formatTanggalIndonesia(langkahBerikutnya.tenggat)}</span>
                    <span aria-hidden="true"> · </span>
                  </>
                ) : null}
                <span>{langkahBerikutnya.keterangan}</span>
              </p>
            )}

            {langkahBerikutnya.jenis === 'kosong' && (
              <p className="text-base text-slate-600 leading-relaxed">
                {langkahBerikutnya.keterangan}
              </p>
            )}
          </div>

          <Link
            to={langkahBerikutnya.route}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <span>
              {langkahBerikutnya.jenis === 'kosong'
                ? ID_TEXT.beranda.langkahAksiTambahTugas
                : langkahBerikutnya.jenis === 'bimbingan'
                  ? ID_TEXT.beranda.langkahAksiBimbingan
                  : langkahBerikutnya.jenis === 'revisi'
                    ? ID_TEXT.beranda.langkahAksiRevisi
                    : ID_TEXT.beranda.langkahAksiRoadmap}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Ringkasan Progres & Target Sidang */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kartu Progres Skripsi */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">
                {ID_TEXT.beranda.progresJudul}
              </p>
              {progres.persen === null ? (
                <p className="text-xl font-bold text-[#0F172A]">
                  {ID_TEXT.beranda.progresKosong}
                </p>
              ) : (
                <p className="text-3xl font-bold text-[#0F172A] tabular-nums">
                  {progres.persen}%
                </p>
              )}
            </div>
            {progres.persen === 100 && (
              <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" aria-hidden="true" />
            )}
          </div>

          {progres.persen !== null && (
            <div className="space-y-2">
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
              <p className="text-sm text-slate-600 tabular-nums">
                {ID_TEXT.beranda.progresRincian(progres.selesai, progres.total)}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">{ID_TEXT.beranda.tahapAktifLabel}</p>
            <p className="text-base font-semibold text-[#0F172A] mt-0.5">
              {tahapAktif
                ? tahapAktif.judul
                : progres.persen === null
                  ? ID_TEXT.beranda.progresKosong
                  : ID_TEXT.beranda.tahapAktifSelesaiSemua}
            </p>
          </div>
        </section>

        {/* Kartu Hitung Mundur Target Sidang */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">
                {ID_TEXT.beranda.targetSidangLabel}
              </p>

              {hitungMundur && profile?.targetSidang ? (
                <p className="text-3xl font-bold text-[#0F172A] tabular-nums">
                  {hitungMundur.status === 'mendatang'
                    ? ID_TEXT.beranda.hitungMundurHari(hitungMundur.hariTersisa)
                    : hitungMundur.status === 'hari_ini'
                      ? ID_TEXT.beranda.hitungMundurHariIni
                      : ID_TEXT.beranda.hitungMundurTerlewat(hitungMundur.hariTersisa)}
                </p>
              ) : (
                <p className="text-xl font-bold text-[#0F172A]">
                  {ID_TEXT.beranda.targetSidangKosongJudul}
                </p>
              )}
            </div>

            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>

          {profile?.targetSidang ? (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-base text-slate-700">
                {formatTanggalIndonesia(profile.targetSidang)}
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {ID_TEXT.beranda.targetSidangKosongDeskripsi}
              </p>
              <Link
                to="/profil"
                className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-[#4F46E5] hover:bg-indigo-50 inline-flex items-center shrink-0 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.beranda.targetSidangTombolAtur}
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Daftar Tenggat 7 Hari ke Depan */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#0F172A]">
              {ID_TEXT.beranda.tenggatJudul}
            </h2>
          </div>
          {tenggatMendatang.length > 0 && (
            <Link
              to="/roadmap"
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 inline-flex items-center transition-colors whitespace-nowrap"
            >
              {ID_TEXT.beranda.langkahAksiRoadmap}
            </Link>
          )}
        </div>

        {tenggatMendatang.length === 0 ? (
          <p className="text-base text-slate-600 leading-relaxed py-2">
            {ID_TEXT.beranda.tenggatKosong}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tenggatMendatang.map((item) => {
              const labelSisa =
                item.sisaHari === 0
                  ? ID_TEXT.beranda.tenggatHariIni
                  : item.sisaHari === 1
                    ? ID_TEXT.beranda.tenggatBesok
                    : ID_TEXT.beranda.tenggatSisaHari(item.sisaHari);

              return (
                <li key={item.tugasId}>
                  <Link
                    to="/roadmap"
                    className="min-h-[56px] py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[#0F172A] truncate">{item.judul}</p>
                      <p className="text-sm text-slate-600 truncate">{item.namaTahap}</p>
                    </div>
                    <div className="text-sm text-slate-600 tabular-nums shrink-0 sm:text-right">
                      <span className="font-medium text-amber-800">{labelSisa}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{formatTanggalSingkat(item.tenggat)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Maksimal satu banner upgrade per layar (disembunyikan 7 hari setelah ditutup) */}
      {turSelesai && <UpgradeBanner />}
    </div>
  );
}
