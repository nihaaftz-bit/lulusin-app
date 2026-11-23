import { BookOpen } from 'lucide-react';
import { ID_TEXT } from '../i18n/id';

export function LoadingSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-label={ID_TEXT.app.memuat}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">
            {ID_TEXT.app.nama}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="h-5 w-2/3 bg-slate-200/80 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-100 rounded-lg animate-pulse" />
          <div className="pt-2">
            <div className="h-11 w-full bg-slate-200/70 rounded-xl animate-pulse" />
          </div>
        </div>

        <p className="text-center text-sm text-slate-600">{ID_TEXT.app.memuat}</p>
      </div>
    </div>
  );
}
