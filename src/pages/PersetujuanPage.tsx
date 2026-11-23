import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';

export function PersetujuanPage() {
  const { simpanPersetujuan, keluar, firebaseUser } = useAuth();
  const [setuju, setSetuju] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!setuju) {
      setErrorMsg(ID_TEXT.persetujuan.errorWajibCentang);
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await simpanPersetujuan();
    } catch {
      setErrorMsg(ID_TEXT.persetujuan.errorSimpan);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg space-y-6">
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

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] leading-tight">
              {ID_TEXT.persetujuan.judul}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.persetujuan.subjudul}
            </p>
            {firebaseUser?.email && (
              <p className="text-sm text-slate-500 pt-1">{firebaseUser.email}</p>
            )}
          </div>

          <ul className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200/60">
            {ID_TEXT.persetujuan.poinRingkas.map((poin) => (
              <li key={poin} className="text-base text-slate-700 leading-relaxed flex gap-2.5">
                <span className="text-[#4F46E5] font-bold" aria-hidden="true">
                  •
                </span>
                <span>{poin}</span>
              </li>
            ))}
          </ul>

          <label className="min-h-[44px] flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => {
                setSetuju(e.target.checked);
                if (e.target.checked) setErrorMsg(null);
              }}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] shrink-0"
            />
            <span className="text-base text-[#0F172A] leading-relaxed">
              {ID_TEXT.persetujuan.checkboxLabel}{' '}
              <Link
                to="/syarat"
                className="text-[#4F46E5] font-medium underline underline-offset-2 hover:text-[#4338CA]"
              >
                {ID_TEXT.persetujuan.syaratLink}
              </Link>{' '}
              {ID_TEXT.persetujuan.dan}{' '}
              <Link
                to="/privasi"
                className="text-[#4F46E5] font-medium underline underline-offset-2 hover:text-[#4338CA]"
              >
                {ID_TEXT.persetujuan.privasiLink}
              </Link>
              .
            </span>
          </label>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm text-amber-900"
            >
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />}
            <span>
              {loading ? ID_TEXT.persetujuan.tombolMemuat : ID_TEXT.persetujuan.tombolLanjut}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
