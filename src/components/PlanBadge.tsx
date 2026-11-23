import { Crown } from 'lucide-react';
import { ID_TEXT } from '../i18n/id';
import type { UserPlan } from '../types/user';

interface PlanBadgeProps {
  plan: UserPlan;
  compact?: boolean;
}

export function PlanBadge({ plan, compact = false }: PlanBadgeProps) {
  if (plan === 'premium') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 font-semibold text-amber-900 whitespace-nowrap shrink-0 ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <Crown className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
        <span>{ID_TEXT.paket.badgePremium}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 font-medium text-slate-700 whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {ID_TEXT.paket.badgeGratis}
    </span>
  );
}
