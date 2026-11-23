import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  CreditCard,
  LogOut,
  MessageSquarePlus,
  Settings,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { PlanBadge } from './PlanBadge';

function ambilInisial(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfileMenu() {
  const { firebaseUser, profile, planStatus, isAdmin, keluar } = useAuth();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const namaTampil =
    profile?.namaLengkap?.trim() ||
    firebaseUser?.displayName?.trim() ||
    ID_TEXT.menuProfil.penggunaDefault;
  const namaPendek = namaTampil.split(/\s+/)[0] || namaTampil;
  const photoUrl = !imgError ? firebaseUser?.photoURL : null;
  const inisial = ambilInisial(namaTampil);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  async function handleKeluar() {
    setSigningOut(true);
    try {
      await keluar();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ID_TEXT.menuProfil.bukaMenu}
        className="min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200/70 transition-colors flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Foto profil ${namaTampil}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-[#4F46E5] text-white text-xs font-semibold flex items-center justify-center shrink-0"
          >
            {inisial}
          </span>
        )}
        <span className="hidden sm:inline text-sm font-medium text-[#0F172A] max-w-[140px] truncate">
          {namaPendek}
        </span>
        <span className="hidden sm:inline-flex">
          <PlanBadge plan={planStatus.effectivePlan} compact />
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={ID_TEXT.menuProfil.bukaMenu}
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-lg py-2 z-50"
        >
          <div className="px-4 py-2.5 border-b border-slate-100 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{namaTampil}</p>
              <PlanBadge plan={planStatus.effectivePlan} compact />
            </div>
            {profile?.universitas && (
              <p className="text-xs text-slate-600 truncate">{profile.universitas}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              to="/profil"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <UserIcon className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.menuProfil.profil}</span>
            </Link>

            <Link
              to="/asisten"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.nav.asisten}</span>
            </Link>

            <Link
              to="/langganan"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <CreditCard className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.menuProfil.langganan}</span>
            </Link>

            <Link
              to="/pengaturan"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.menuProfil.pengaturan}</span>
            </Link>

            <Link
              to="/pengaturan#masukan"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-[#0F172A] hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <MessageSquarePlus className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>{ID_TEXT.menuProfil.masukan}</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base font-medium text-[#4F46E5] hover:bg-indigo-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.menuProfil.panelAdmin}</span>
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={handleKeluar}
              className="w-full min-h-[44px] px-4 py-2.5 flex items-center gap-3 text-base text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {signingOut ? ID_TEXT.menuProfil.keluarMemuat : ID_TEXT.menuProfil.keluar}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
