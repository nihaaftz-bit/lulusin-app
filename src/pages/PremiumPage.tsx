import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, Crown, ExternalLink, ShieldCheck } from 'lucide-react';
import { PlanBadge } from '../components/PlanBadge';
import { PLAN_CONFIG } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';

export function PremiumPage() {
  const { firebaseUser, planStatus } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isPremium = planStatus.effectivePlan === 'premium';

  return (
    <div className="max-w-4xl space-y-8 pb-8">
      {!firebaseUser && (
        <div>
          <Link
            to="/"
            className="min-h-[44px] -ml-2 px-3 py-2 rounded-xl text-base font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{ID_TEXT.errorPage.kembaliKeAwal}</span>
          </Link>
        </div>
      )}

      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <PlanBadge plan={planStatus.effectivePlan} />
          <span className="text-sm text-slate-600">
            {PLAN_CONFIG.paket.premium.nama} · {PLAN_CONFIG.hargaLengkapLabel}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-balance">
          {ID_TEXT.paket.halamanPremium.judul}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
          {ID_TEXT.paket.halamanPremium.subjudul}
        </p>
      </header>

      {/* Kartu Paket Gratis vs Premium */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Paket Gratis */}
        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-[#0F172A]">{PLAN_CONFIG.paket.free.nama}</h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {PLAN_CONFIG.paket.free.subjudul}
            </p>
            <p className="text-3xl font-bold text-[#0F172A] tabular-nums pt-1">
              {PLAN_CONFIG.paket.free.hargaLabel}{' '}
              <span className="text-sm font-normal text-slate-600">
                / {PLAN_CONFIG.paket.free.periodeLabel}
              </span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {!isPremium ? (
              <span className="min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium text-base inline-flex items-center justify-center">
                {ID_TEXT.paket.halamanPremium.kartuGratisCta}
              </span>
            ) : (
              <Link
                to="/langganan"
                className="min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-base inline-flex items-center justify-center transition-colors"
              >
                {ID_TEXT.menuProfil.langganan}
              </Link>
            )}
          </div>
        </article>

        {/* Paket Premium */}
        <article className="bg-white rounded-2xl border-2 border-[#4F46E5] shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-[#0F172A] inline-flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{PLAN_CONFIG.paket.premium.nama}</span>
              </h2>
              <span className="text-xs font-semibold text-[#4F46E5]">
                {ID_TEXT.paket.halamanPremium.kartuPremiumBadge}
              </span>
            </div>

            <p className="text-base text-slate-600 leading-relaxed">
              {PLAN_CONFIG.paket.premium.subjudul}
            </p>

            <div className="pt-1">
              <p className="text-3xl font-bold text-[#0F172A] tabular-nums">
                {PLAN_CONFIG.hargaPremiumLabel}{' '}
                <span className="text-sm font-normal text-slate-600">
                  / {PLAN_CONFIG.periodePremiumLabel}
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {ID_TEXT.paket.halamanPremium.kartuPremiumCatatan}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {isPremium ? (
              <div className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-base inline-flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" aria-hidden="true" />
                <span>{ID_TEXT.paket.halamanPremium.tombolAktifSudah}</span>
              </div>
            ) : (
              <a
                href={PLAN_CONFIG.upgradeWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                <span>{ID_TEXT.paket.halamanPremium.tombolUpgradeWa}</span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
            )}
            <p className="text-xs text-slate-600 leading-relaxed">
              {ID_TEXT.paket.halamanPremium.catatanAktivasi}
            </p>
          </div>
        </article>
      </section>

      {/* Tabel Perbandingan Gratis vs Premium */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#0F172A]">
            {ID_TEXT.paket.halamanPremium.tabelJudul}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-sm font-semibold text-[#0F172A]">
                <th className="py-3.5 px-6">{ID_TEXT.paket.halamanPremium.kolomFitur}</th>
                <th className="py-3.5 px-6">{ID_TEXT.paket.halamanPremium.kolomGratis}</th>
                <th className="py-3.5 px-6 text-[#4F46E5]">
                  {ID_TEXT.paket.halamanPremium.kolomPremium}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
              {PLAN_CONFIG.tabelPerbandingan.map((row) => (
                <tr key={row.fitur} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-medium text-[#0F172A]">{row.fitur}</td>
                  <td className="py-3.5 px-6 text-slate-600">{row.gratis}</td>
                  <td className="py-3.5 px-6 font-medium text-[#0F172A]">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Jaminan Data */}
      <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-5 flex items-start gap-3 text-sm sm:text-base text-slate-700 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
        <p>{ID_TEXT.paket.langganan.infoBerakhir}</p>
      </div>

      {/* FAQ Singkat */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">
          {ID_TEXT.paket.halamanPremium.faqJudul}
        </h2>
        <div className="space-y-3">
          {PLAN_CONFIG.faq.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.tanya}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
                  className="w-full min-h-[52px] px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#4F46E5]"
                >
                  <span className="text-base font-semibold text-[#0F172A]">{item.tanya}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-base text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.jawab}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
