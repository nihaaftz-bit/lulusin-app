import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  CheckSquare,
  Home,
  Map,
  MessageSquareText,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { ProfileMenu } from './ProfileMenu';

const MOBILE_NAV_ITEMS = [
  { to: '/beranda', label: ID_TEXT.nav.beranda, icon: Home },
  { to: '/roadmap', label: ID_TEXT.nav.roadmap, icon: Map },
  { to: '/bimbingan', label: ID_TEXT.nav.bimbingan, icon: MessageSquareText },
  { to: '/revisi', label: ID_TEXT.nav.revisi, icon: CheckSquare },
  { to: '/jurnal', label: ID_TEXT.nav.jurnal, icon: BookMarked },
] as const;

const DESKTOP_NAV_ITEMS = [
  ...MOBILE_NAV_ITEMS,
  { to: '/asisten', label: ID_TEXT.nav.asisten, icon: Sparkles },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isOffline } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside
        aria-label={ID_TEXT.nav.menuUtamaLabel}
        className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 z-30"
      >
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            {ID_TEXT.app.nama}
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-base font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                  isActive
                    ? 'bg-indigo-50 text-[#4F46E5]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header Atas (Mobile & Desktop) */}
        <header className="sticky top-0 z-20 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
              {ID_TEXT.app.nama}
            </span>
          </div>

          <div className="hidden md:block" />

          <div className="flex items-center gap-1.5">
            <NavLink
              to="/asisten"
              className={({ isActive }) =>
                `md:hidden min-h-[44px] px-3 py-1.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-[#4F46E5]'
                    : 'text-[#4F46E5] hover:bg-indigo-50/70'
                }`
              }
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.nav.asisten}</span>
            </NavLink>
            <ProfileMenu />
          </div>
        </header>

        {isOffline && (
          <div
            role="status"
            className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5 text-sm text-amber-900"
          >
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.app.offlineBanner}</span>
          </div>
        )}

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* Bottom Bar Mobile (Maksimal 5 item, tanpa tombol mengambang) */}
      <nav
        aria-label={ID_TEXT.nav.menuUtamaLabel}
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `min-h-[44px] h-full flex flex-col items-center justify-center gap-1 px-1 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5] ${
                  isActive ? 'text-[#4F46E5]' : 'text-slate-600 hover:text-[#0F172A]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-5 h-5 shrink-0"
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium leading-none truncate max-w-full">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
