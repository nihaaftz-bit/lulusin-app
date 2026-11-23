import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { PlanBadge } from '../components/PlanBadge';
import { PLAN_CONFIG } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import {
  ADMIN_USERS_LIMIT,
  cabutPremium,
  fetchAdminUsers,
  setPremium,
} from '../lib/adminService';
import { formatTanggalIndonesia } from '../lib/date';
import {
  filterAdminUsers,
  formatSumberPremium,
  resolveEffectivePlan,
  type AdminPaketFilter,
  type SafeAdminUserRow,
} from '../lib/planLogic';

export function AdminPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<SafeAdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterPaket, setFilterPaket] = useState<AdminPaketFilter>('semua');
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [confirmCabutUid, setConfirmCabutUid] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers();
      setRows(data);
    } catch {
      setError(ID_TEXT.paket.admin.errorMuat);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void loadUsers();
  }, [isAdmin, loadUsers]);

  const filteredRows = useMemo(
    () => filterAdminUsers(rows, search, filterPaket),
    [rows, search, filterPaket]
  );

  const summary = useMemo(() => {
    let aktif = 0;
    let free = 0;
    for (const r of rows) {
      const st = resolveEffectivePlan({
        plan: r.plan,
        premiumUntil: r.premiumUntil,
        sumberPremium: r.sumberPremium,
      });
      if (st.effectivePlan === 'premium') aktif += 1;
      else free += 1;
    }
    return { total: rows.length, aktif, free };
  }, [rows]);

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-[#0F172A]">
              {ID_TEXT.paket.admin.tolakJudul}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {ID_TEXT.paket.admin.tolakDeskripsi}
            </p>
          </div>
          <Link
            to="/beranda"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base inline-flex items-center justify-center transition-colors"
          >
            {ID_TEXT.app.kembaliKeBeranda}
          </Link>
        </section>
      </div>
    );
  }

  async function handleAktifkanPremium(row: SafeAdminUserRow) {
    setError('');
    setStatusMsg('');
    setActionUid(row.uid);
    try {
      const result = await setPremium(row.uid, PLAN_CONFIG.durasiPremiumHari, 'manual');
      setRows((prev) =>
        prev.map((item) =>
          item.uid === row.uid
            ? {
                ...item,
                plan: 'premium',
                premiumUntil: result.premiumUntil,
                sumberPremium: result.sumberPremium,
              }
            : item
        )
      );
      setConfirmCabutUid(null);
      setStatusMsg(ID_TEXT.paket.admin.suksesAktif(row.namaLengkap || row.email));
    } catch {
      setError(ID_TEXT.paket.admin.errorAksi);
    } finally {
      setActionUid(null);
    }
  }

  async function handleCabutPremium(row: SafeAdminUserRow) {
    setError('');
    setStatusMsg('');
    setActionUid(row.uid);
    try {
      await cabutPremium(row.uid);
      setRows((prev) =>
        prev.map((item) =>
          item.uid === row.uid
            ? {
                ...item,
                plan: 'free',
                premiumUntil: null,
                sumberPremium: null,
              }
            : item
        )
      );
      setConfirmCabutUid(null);
      setStatusMsg(ID_TEXT.paket.admin.suksesCabut(row.namaLengkap || row.email));
    } catch {
      setError(ID_TEXT.paket.admin.errorAksi);
    } finally {
      setActionUid(null);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {ID_TEXT.paket.admin.judul}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
            {ID_TEXT.paket.admin.subjudul}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] font-medium text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 self-start disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{ID_TEXT.paket.admin.muatUlang}</span>
        </button>
      </header>

      {/* Catatan Privasi & Spark Plan */}
      <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium text-[#0F172A]">{ID_TEXT.paket.admin.catatanPrivasi}</p>
          <p>{ID_TEXT.paket.admin.catatanSpark}</p>
        </div>
      </div>

      {/* Ringkasan Angka */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-sm text-slate-600">Total dimuat</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">{summary.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-sm text-slate-600">Premium aktif</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">{summary.aktif}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-sm text-slate-600">Paket Gratis</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">{summary.free}</p>
        </div>
      </div>

      {/* Pencarian & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ID_TEXT.paket.admin.cariPlaceholder}
            aria-label={ID_TEXT.paket.admin.cariPlaceholder}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-base text-[#0F172A] placeholder:text-slate-500 focus:border-[#4F46E5] focus:outline-none"
          />
        </div>

        <div className="sm:w-56">
          <label htmlFor="admin-filter-paket" className="sr-only">
            {ID_TEXT.paket.admin.filterLabel}
          </label>
          <select
            id="admin-filter-paket"
            value={filterPaket}
            onChange={(e) => setFilterPaket(e.target.value as AdminPaketFilter)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-base text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
          >
            <option value="semua">{ID_TEXT.paket.admin.filterOptions.semua}</option>
            <option value="free">{ID_TEXT.paket.admin.filterOptions.free}</option>
            <option value="premium_aktif">
              {ID_TEXT.paket.admin.filterOptions.premium_aktif}
            </option>
            <option value="premium_berakhir">
              {ID_TEXT.paket.admin.filterOptions.premium_berakhir}
            </option>
          </select>
        </div>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{statusMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Daftar Pengguna */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600 tabular-nums">
            {ID_TEXT.paket.admin.batasInfo(filteredRows.length, ADMIN_USERS_LIMIT)}
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3" aria-busy="true">
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-base text-slate-600">
            {ID_TEXT.paket.admin.kosong}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="py-3.5 px-5">{ID_TEXT.paket.admin.kolomNama}</th>
                  <th className="py-3.5 px-5">{ID_TEXT.paket.admin.kolomKampus}</th>
                  <th className="py-3.5 px-5">{ID_TEXT.paket.admin.kolomPaket}</th>
                  <th className="py-3.5 px-5">{ID_TEXT.paket.admin.kolomDaftar}</th>
                  <th className="py-3.5 px-5 text-right">{ID_TEXT.paket.admin.kolomAksi}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRows.map((row) => {
                  const status = resolveEffectivePlan({
                    plan: row.plan,
                    premiumUntil: row.premiumUntil,
                    sumberPremium: row.sumberPremium,
                  });
                  const isBusy = actionUid === row.uid;
                  const isConfirmCabut = confirmCabutUid === row.uid;
                  const hasRawPremium = row.plan === 'premium';

                  return (
                    <tr key={row.uid} className="hover:bg-slate-50/70 align-top">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-[#0F172A]">
                          {row.namaLengkap || '(Belum mengisi nama)'}
                        </p>
                        <p className="text-slate-600 break-all">{row.email}</p>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-medium text-[#0F172A]">{row.universitas || '-'}</p>
                        <p className="text-slate-600">{row.prodi || '-'}</p>
                      </td>

                      <td className="py-4 px-5 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PlanBadge plan={status.effectivePlan} compact />
                          {status.isExpired && (
                            <span className="text-xs font-medium text-amber-800">Kedaluwarsa</span>
                          )}
                        </div>
                        {row.premiumUntil && (
                          <p className="text-xs text-slate-600 tabular-nums">
                            s.d. {formatTanggalIndonesia(row.premiumUntil)}
                          </p>
                        )}
                        {row.sumberPremium && (
                          <p className="text-xs text-slate-600">
                            {formatSumberPremium(row.sumberPremium)}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-600 tabular-nums whitespace-nowrap">
                        {row.createdAtIso ? formatTanggalIndonesia(row.createdAtIso) : '-'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleAktifkanPremium(row)}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>
                              {status.effectivePlan === 'premium'
                                ? ID_TEXT.paket.admin.tombolPerpanjang
                                : ID_TEXT.paket.admin.tombolAktifkan}
                            </span>
                          </button>

                          {hasRawPremium &&
                            (isConfirmCabut ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleCabutPremium(row)}
                                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold whitespace-nowrap disabled:opacity-60"
                                >
                                  {ID_TEXT.paket.admin.yaCabut}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmCabutUid(null)}
                                  className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium whitespace-nowrap"
                                >
                                  {ID_TEXT.paket.admin.batal}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setConfirmCabutUid(row.uid)}
                                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-medium whitespace-nowrap disabled:opacity-60"
                              >
                                {ID_TEXT.paket.admin.tombolCabut}
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
