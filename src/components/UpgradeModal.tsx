import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Crown, X } from 'lucide-react';
import { PLAN_CONFIG, type PremiumFeatureKey } from '../config/plans';
import { ID_TEXT } from '../i18n/id';

interface UpgradeModalProps {
  open: boolean;
  featureKey: PremiumFeatureKey | null;
  onClose: () => void;
}

export function UpgradeModal({ open, featureKey, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !featureKey) return null;

  const feature = PLAN_CONFIG.fiturGerbang[featureKey];

  function handleUpgradeClick() {
    onClose();
    navigate('/premium');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 id="upgrade-modal-title" className="text-xl font-bold text-[#0F172A]">
                {ID_TEXT.paket.upgradeModal.judul}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {ID_TEXT.paket.upgradeModal.subjudul(feature.judul)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={ID_TEXT.app.tutup}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-xl text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          <p className="text-sm font-semibold text-[#0F172A]">
            {ID_TEXT.paket.upgradeModal.labelManfaat}
          </p>
          <ul className="space-y-2.5">
            {PLAN_CONFIG.manfaatUtama.map((item) => (
              <li key={item.judul} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <p className="text-sm sm:text-base font-semibold text-[#0F172A] leading-snug">
                    {item.judul}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.deskripsi}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-600">
            {ID_TEXT.paket.upgradeModal.hargaLabel}
          </span>
          <div className="sm:text-right">
            <p className="text-lg font-bold text-[#0F172A] tabular-nums">
              {PLAN_CONFIG.hargaLengkapLabel}
            </p>
            <p className="text-xs text-slate-600">
              {ID_TEXT.paket.upgradeModal.catatanTanpaAutoDebit}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            {ID_TEXT.paket.upgradeModal.tombolNanti}
          </button>

          <button
            type="button"
            onClick={handleUpgradeClick}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <span>{ID_TEXT.paket.upgradeModal.tombolUpgrade}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
