import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { ID_TEXT } from '../i18n/id';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-[#0F172A] mb-2">
          {ID_TEXT.errorPage.judul404}
        </h1>
        <p className="text-base text-slate-600 mb-6 leading-relaxed">
          {ID_TEXT.errorPage.deskripsi404}
        </p>
        <Link
          to="/"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] whitespace-nowrap"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>{ID_TEXT.errorPage.kembaliKeAwal}</span>
        </Link>
      </div>
    </div>
  );
}
