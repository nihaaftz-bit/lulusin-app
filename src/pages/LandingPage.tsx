import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Loader2,
  Map,
  MessageSquareText,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import type { AuthErrorDetail } from '../lib/firebase';

const FEATURE_ICONS = [Map, MessageSquareText, CheckSquare, BookMarked] as const;

export function LandingPage() {
  const { masukDenganGoogle, isOffline, authRedirectError, clearAuthRedirectError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState<AuthErrorDetail | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  async function handleGoogleLogin() {
    clearAuthRedirectError();
    if (isOffline) {
      setErrorDetail({ message: ID_TEXT.login.errorOffline, code: 'offline' });
      return;
    }

    setErrorDetail(null);
    setLoading(true);
    try {
      const { error } = await masukDenganGoogle();
      if (error) {
        setErrorDetail(error);
      }
    } finally {
      setLoading(false);
    }
  }

  const activeError = errorDetail || authRedirectError;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {isOffline && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2.5 text-sm text-amber-900"
        >
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
          <span>{ID_TEXT.app.offlineBanner}</span>
        </div>
      )}

      {/* Header Top Bar — 3 zona terpisah rapi */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] rounded-xl"
          >
            <span className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
              {ID_TEXT.app.nama}
            </span>
          </Link>

          <nav
            aria-label="Navigasi halaman utama"
            className="hidden md:flex items-center gap-8"
          >
            <a
              href="#masalah"
              className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              {ID_TEXT.landing.nav.masalah}
            </a>
            <a
              href="#fitur"
              className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              {ID_TEXT.landing.nav.fitur}
            </a>
            <a
              href="#cara-kerja"
              className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              {ID_TEXT.landing.nav.caraKerja}
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              {ID_TEXT.landing.nav.faq}
            </a>
          </nav>

          <div className="shrink-0">
            <Link
              to="/login"
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              {ID_TEXT.landing.nav.masuk}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight leading-[1.15] text-balance">
                  {ID_TEXT.landing.hero.judul}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  {ID_TEXT.landing.hero.subjudul}
                </p>
              </div>

              {activeError && (
                <div
                  role="alert"
                  className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900 leading-relaxed max-w-xl"
                >
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1 min-w-0">
                    <p>{activeError.message}</p>
                    {activeError.code && (
                      <p className="text-xs font-mono text-amber-800 break-all">
                        {activeError.code}
                      </p>
                    )}
                    {typeof window !== 'undefined' && window.location.hostname && (
                      <p className="text-xs font-mono text-amber-800 break-all">
                        Domain: {window.location.hostname}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full sm:w-auto min-h-[52px] px-6 py-3.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-semibold text-base shadow-sm transition-all inline-flex items-center justify-center gap-3 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
                      <span>{ID_TEXT.landing.hero.ctaMemuat}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                          />
                        </svg>
                      </span>
                      <span>{ID_TEXT.landing.hero.ctaUtama}</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {ID_TEXT.landing.hero.catatanCta}
                </p>
              </div>
            </div>

            {/* Pratinjau UI Bersih — Tanpa ilustrasi berat agar LCP cepat di mobile */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <p className="text-sm font-semibold text-slate-600">
                    {ID_TEXT.landing.hero.pratinjauJudul}
                  </p>
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" aria-hidden="true" />
                </div>

                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#4F46E5]">
                    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{ID_TEXT.landing.hero.pratinjauLangkahLabel}</span>
                  </div>
                  <p className="text-base font-semibold text-[#0F172A] leading-snug">
                    {ID_TEXT.landing.hero.pratinjauLangkahIsi}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-600">
                      {ID_TEXT.landing.hero.pratinjauProgresLabel}
                    </span>
                    <span className="text-xl font-bold text-[#0F172A] tabular-nums">
                      {ID_TEXT.landing.hero.pratinjauProgresAngka}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full w-[62%]" />
                  </div>
                  <p className="text-sm text-slate-600 pt-1">
                    {ID_TEXT.landing.hero.pratinjauTahap}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Masalah Mahasiswa */}
        <section id="masalah" className="bg-white border-y border-slate-200/80 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-balance">
                {ID_TEXT.landing.masalah.judul}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {ID_TEXT.landing.masalah.subjudul}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ID_TEXT.landing.masalah.daftar.map((item) => (
                <article
                  key={item.nomor}
                  className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-6 space-y-3"
                >
                  <p className="text-sm font-bold text-[#4F46E5] tabular-nums">{item.nomor}</p>
                  <h3 className="text-lg font-semibold text-[#0F172A] leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed">{item.deskripsi}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Fitur Utama */}
        <section id="fitur" className="py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-balance">
                {ID_TEXT.landing.fitur.judul}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {ID_TEXT.landing.fitur.subjudul}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ID_TEXT.landing.fitur.daftar.map((item, idx) => {
                const Icon = FEATURE_ICONS[idx] || BookOpen;
                return (
                  <article
                    key={item.judul}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A]">{item.judul}</h3>
                    <p className="text-base text-slate-600 leading-relaxed">{item.deskripsi}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cara Kerja 3 Langkah */}
        <section id="cara-kerja" className="bg-white border-y border-slate-200/80 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-balance">
              {ID_TEXT.landing.caraKerja.judul}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ID_TEXT.landing.caraKerja.daftar.map((item) => (
                <article
                  key={item.langkah}
                  className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-6 space-y-2.5"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#4F46E5]">
                    {item.langkah}
                  </p>
                  <h3 className="text-lg font-semibold text-[#0F172A]">{item.judul}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{item.deskripsi}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-14 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-center text-balance">
              {ID_TEXT.landing.faq.judul}
            </h2>

            <div className="space-y-3">
              {ID_TEXT.landing.faq.daftar.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.tanya}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                      className="w-full min-h-[56px] px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
                    >
                      <span className="text-base font-semibold text-[#0F172A]">{item.tanya}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 shrink-0 transition-transform duration-150 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-base text-slate-600 leading-relaxed border-t border-slate-100">
                        {item.jawab}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                <span>{loading ? ID_TEXT.landing.hero.ctaMemuat : ID_TEXT.landing.hero.ctaUtama}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-base font-bold text-[#0F172A]">{ID_TEXT.app.nama}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {ID_TEXT.landing.footer.deskripsi}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <Link
                to="/syarat"
                className="min-h-[44px] inline-flex items-center text-slate-600 hover:text-[#0F172A] underline underline-offset-4"
              >
                {ID_TEXT.login.tautanSyarat}
              </Link>
              <Link
                to="/privasi"
                className="min-h-[44px] inline-flex items-center text-slate-600 hover:text-[#0F172A] underline underline-offset-4"
              >
                {ID_TEXT.login.tautanPrivasi}
              </Link>
              <Link
                to="/login"
                className="min-h-[44px] inline-flex items-center text-[#4F46E5] hover:text-[#4338CA] underline underline-offset-4"
              >
                {ID_TEXT.landing.nav.masuk}
              </Link>
            </div>
          </div>

          <p className="text-xs text-slate-600 border-t border-slate-100 pt-6">
            {ID_TEXT.landing.footer.hakCipta}
          </p>
        </div>
      </footer>
    </div>
  );
}
