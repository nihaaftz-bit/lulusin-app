import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, X } from 'lucide-react';
import { PLAN_CONFIG } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { dismissUpgradeBanner, shouldShowUpgradeBanner } from '../lib/planLogic';

/**
 * Maksimal satu banner upgrade per layar:
 * - Hanya tampil untuk pengguna paket Gratis (termasuk jika Premium sudah kedaluwarsa).
 * - Saat ditutup, disembunyikan selama 7 hari di localStorage.
 */
export function UpgradeBanner() {
  const { firebaseUser, planStatus } = useAuth();
  const uid = firebaseUser?.uid ?? '';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!uid || planStatus.effectivePlan === 'premium') {
      setVisible(false);
      return;
    }
    setVisible(shouldShowUpgradeBanner(uid));
  }, [uid, planStatus.effectivePlan]);

  if (!visible || planStatus.effectivePlan === 'premium') {
    return null;
  }

  function handleDismiss() {
    setVisible(false);
    if (uid) {
      dismissUpgradeBanner(uid);
    }
  }

  return (
    <aside
      aria-label={ID_TEXT.paket.banner.judul}
      className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-base font-semibold text-[#0F172A] leading-snug">
            {ID_TEXT.paket.banner.judul}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {ID_TEXT.paket.banner.deskripsi}{' '}
            <span className="font-semibold text-[#0F172A] tabular-nums">
              ({PLAN_CONFIG.hargaLengkapLabel})
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Link
          to="/premium"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        >
          <span>{ID_TEXT.paket.banner.tombolLihat}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={ID_TEXT.paket.banner.tombolTutup}
          className="min-h-[44px] min-w-[44px] rounded-xl text-slate-600 hover:text-[#0F172A] hover:bg-indigo-100/70 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
