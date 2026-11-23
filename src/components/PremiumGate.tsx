import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { PLAN_CONFIG, type PremiumFeatureKey } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeModal } from './UpgradeModal';

interface PremiumGateRenderProps {
  isPremium: boolean;
  handleClick: () => void;
}

interface PremiumGateProps {
  feature: PremiumFeatureKey;
  onAuthorized: () => void;
  label?: string;
  className?: string;
  children?: (props: PremiumGateRenderProps) => React.ReactNode;
}

/**
 * Menampilkan fitur Premium beserta ikon mahkota.
 * - Jika paket efektif Premium: klik langsung menjalankan `onAuthorized()`.
 * - Jika paket Gratis (atau Premium sudah kedaluwarsa): klik membuka UpgradeModal.
 */
export function PremiumGate({
  feature,
  onAuthorized,
  label,
  className = '',
  children,
}: PremiumGateProps) {
  const { planStatus } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const isPremium = planStatus.effectivePlan === 'premium';
  const featureMeta = PLAN_CONFIG.fiturGerbang[feature];

  function handleClick() {
    if (isPremium) {
      onAuthorized();
    } else {
      setModalOpen(true);
    }
  }

  return (
    <>
      {children ? (
        children({ isPremium, handleClick })
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${className}`}
        >
          <Crown className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>{label || featureMeta.judul}</span>
        </button>
      )}

      <UpgradeModal
        open={modalOpen}
        featureKey={feature}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
