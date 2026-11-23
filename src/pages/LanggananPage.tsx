import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle2, Crown, Download, ShieldCheck } from 'lucide-react';
import { PlanBadge } from '../components/PlanBadge';
import { PLAN_CONFIG } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { formatTanggalIndonesia } from '../lib/date';
import { formatSumberPremium } from '../lib/planLogic';

export function LanggananPage() {
  const { planStatus } = useAuth();
  const isPremium = planStatus.effectivePlan === 'premium';

  const statusText = isPremium
    ? ID_TEXT.paket.langganan.statusAktifPremium
    : planStatus.isExpired
      ? ID_TEXT.paket.langganan.statusBerakhir
      : ID_TEXT.paket.langganan.statusGratis;

  return (
    <div className="max-w-3xl space-y-6 pb-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          {ID_TEXT.paket.langganan.judul}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          {ID_TEXT.paket.langganan.subjudul}
        </p>
      </header>

      {/* Kartu Status Paket */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-600">
              {ID_TEXT.paket.langganan.statusLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <PlanBadge plan={planStatus.effectivePlan} />
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">{statusText}</h2>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-sm font-medium text-slate-600">
              {isPremium ? PLAN_CONFIG.paket.premium.nama : PLAN_CONFIG.paket.free.nama}
            </p>
            <p className="text-lg font-bold text-[#0F172A] tabular-nums">
              {isPremium ? PLAN_CONFIG.hargaLengkapLabel : PLAN_CONFIG.paket.free.hargaLabel}
            </p>
          </div>
        </div>

        {(isPremium || planStatus.isExpired) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 space-y-1">
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>{ID_TEXT.paket.langganan.berakhirLabel}</span>
              </p>
              <p className="text-base font-semibold text-[#0F172A] tabular-nums">
                {planStatus.premiumUntil ? formatTanggalIndonesia(planStatus.premiumUntil) : '-'}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 space-y-1">
              <p className="text-xs font-medium text-slate-600">
                {ID_TEXT.paket.langganan.sisaHariLabel}
              </p>
              <p className="text-base font-semibold text-[#0F172A] tabular-nums">
                {isPremium && planStatus.sisaHari !== null
                  ? ID_TEXT.paket.langganan.sisaHariNilai(planStatus.sisaHari)
                  : '0 hari'}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 space-y-1">
              <p className="text-xs font-medium text-slate-600">
                {ID_TEXT.paket.langganan.sumberLabel}
              </p>
              <p className="text-base font-semibold text-[#0F172A]">
                {formatSumberPremium(planStatus.sumberPremium)}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 flex items-start gap-3 text-sm sm:text-base text-slate-700 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            {planStatus.isExpired
              ? ID_TEXT.paket.langganan.infoBerakhir
              : ID_TEXT.paket.langganan.infoGratis}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            to="/premium"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isPremium
                ? ID_TEXT.paket.langganan.tombolPerpanjang
                : ID_TEXT.paket.langganan.tombolLihatPaket}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>

          <Link
            to="/pengaturan"
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Download className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
            <span>{ID_TEXT.paket.langganan.tombolUnduhData}</span>
          </Link>
        </div>
      </section>

      {/* Ringkasan Manfaat */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">
          {ID_TEXT.paket.upgradeModal.labelManfaat}
        </h2>
        <ul className="space-y-3">
          {PLAN_CONFIG.manfaatUtama.map((item) => (
            <li key={item.judul} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-base font-semibold text-[#0F172A]">{item.judul}</p>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {item.deskripsi}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
