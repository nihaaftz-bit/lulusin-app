import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { ID_TEXT } from '../i18n/id';

export function LegalPage({ jenis }: { jenis: 'syarat' | 'privasi' }) {
  const navigate = useNavigate();
  const konten = jenis === 'syarat' ? ID_TEXT.legal.syarat : ID_TEXT.legal.privasi;
  const targetLain = jenis === 'syarat' ? '/privasi' : '/syarat';
  const labelLain = jenis === 'syarat' ? ID_TEXT.login.tautanPrivasi : ID_TEXT.login.tautanSyarat;

  function handleKembali() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] px-4 py-8 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleKembali}
            className="min-h-[44px] -ml-2 px-3 py-2 rounded-xl text-base font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{ID_TEXT.legal.kembali}</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold text-[#0F172A]">{ID_TEXT.app.nama}</span>
          </Link>
        </div>

        <div
          role="note"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-950 leading-relaxed"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p>{ID_TEXT.legal.peringatanDraf}</p>
        </div>

        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <header className="space-y-2 pb-4 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-[#0F172A]">{konten.judul}</h1>
            <p className="text-base text-slate-600 leading-relaxed">{konten.ringkasan}</p>
            <p className="text-xs text-slate-600 pt-1">{ID_TEXT.legal.diperbarui}</p>
          </header>

          <div className="space-y-5">
            {konten.bagian.map((item) => (
              <section key={item.judul} className="space-y-1.5">
                <h2 className="text-lg font-semibold text-[#0F172A]">{item.judul}</h2>
                <p className="text-base text-slate-700 leading-relaxed">{item.isi}</p>
              </section>
            ))}
          </div>

          <footer className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-sm">
            <Link
              to={targetLain}
              className="min-h-[44px] inline-flex items-center font-medium text-[#4F46E5] hover:text-[#4338CA] underline underline-offset-4"
            >
              Lihat {labelLain}
            </Link>
            <Link
              to="/"
              className="min-h-[44px] inline-flex items-center font-medium text-slate-600 hover:text-[#0F172A]"
            >
              {ID_TEXT.errorPage.kembaliKeAwal}
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
