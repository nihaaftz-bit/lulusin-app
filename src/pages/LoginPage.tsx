import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import type { AuthErrorDetail } from '../lib/firebase';

export function LoginPage() {
  const { masukDenganGoogle, isOffline, authRedirectError, clearAuthRedirectError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState<AuthErrorDetail | null>(null);

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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Kolom Pengenalan (Desktop & Mobile atas) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
              {ID_TEXT.app.nama}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight text-balance">
              {ID_TEXT.app.tagline}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.login.deskripsi}
            </p>
          </div>

          {/* Blok warna & ikon sederhana sebagai ruang ilustrasi ringan */}
          {/* Tempat ilustrasi meja belajar mahasiswa dapat ditambahkan nanti */}
          <div className="hidden lg:block bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-3">
            {ID_TEXT.login.fiturRingkas.map((poin) => (
              <div key={poin} className="flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-base text-slate-700 leading-snug">{poin}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kartu Masuk Google */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-[#0F172A]">
                {ID_TEXT.login.sambutan}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {ID_TEXT.login.catatanKeamanan}
              </p>
            </div>

            {activeError && (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900 leading-relaxed"
              >
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1 min-w-0">
                  <p>{activeError.message}</p>
                  {activeError.code && (
                    <p className="text-xs font-mono text-amber-800/90 break-all">
                      {activeError.code}
                    </p>
                  )}
                  {typeof window !== 'undefined' && window.location.hostname && (
                    <p className="text-xs font-mono text-amber-800/90 break-all">
                      Domain: {window.location.hostname}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
                  <span>{ID_TEXT.login.tombolGoogleMemuat}</span>
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
                  <span>{ID_TEXT.login.tombolGoogle}</span>
                </>
              )}
            </button>

            <p className="text-sm text-slate-600 text-center leading-relaxed">
              {ID_TEXT.login.teksPersetujuanAwal}{' '}
              <Link
                to="/syarat"
                className="text-[#4F46E5] font-medium underline underline-offset-2 hover:text-[#4338CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.login.tautanSyarat}
              </Link>{' '}
              {ID_TEXT.login.penghubungDan}{' '}
              <Link
                to="/privasi"
                className="text-[#4F46E5] font-medium underline underline-offset-2 hover:text-[#4338CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                {ID_TEXT.login.tautanPrivasi}
              </Link>{' '}
              {ID_TEXT.login.teksPersetujuanAkhir}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
