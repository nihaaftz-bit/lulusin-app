import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Crown,
  Loader2,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { PlanBadge } from '../components/PlanBadge';
import { PLAN_CONFIG } from '../config/plans';
import { useAuth } from '../contexts/AuthContext';
import { ID_TEXT } from '../i18n/id';
import { db } from '../lib/firebase';

interface TransactionRecord {
  id: string;
  uid: string;
  email: string;
  namaLengkap: string;
  paket: string;
  nominal: number;
  metode: string;
  status: string;
  createdAt?: { toDate?: () => Date } | null;
}

export function PremiumPage() {
  const { firebaseUser, profile, planStatus, isAdmin } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'QRIS' | 'GoPay / DANA / OVO' | 'Transfer VA'>('QRIS');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  const isPremium = planStatus.effectivePlan === 'premium';

  // Ambil daftar transaksi secara real-time khusus jika dibuka oleh Admin
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TransactionRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<TransactionRecord, 'id'>),
        }));
        setTransactions(list);
      },
      (err) => {
        console.error('Gagal memuat daftar transaksi:', err);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  async function handleConfirmPayment() {
    if (!firebaseUser) {
      setPaymentError('Silakan masuk dengan akun Google terlebih dahulu sebelum melakukan pembayaran.');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const now = new Date();
      const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Update status akun user di Firestore menjadi premium selama 30 hari
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        plan: 'premium',
        premiumUntil: validUntil,
        sumberPremium: `checkout_${selectedMethod.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        updatedAt: serverTimestamp(),
      });

      // 2. Catat riwayat pembayaran ke koleksi 'transactions' agar bisa dilacak
      await addDoc(collection(db, 'transactions'), {
        uid: firebaseUser.uid,
        email: firebaseUser.email || profile?.email || '-',
        namaLengkap: profile?.namaLengkap || firebaseUser.displayName || 'Pengguna Lulusin',
        paket: 'Lulusin Premium (30 Hari)',
        nominal: 19000,
        metode: selectedMethod,
        status: 'LUNAS',
        validUntil,
        createdAt: serverTimestamp(),
      });

      setShowCheckout(false);
    } catch (err) {
      console.error('Gagal memproses aktivasi premium:', err);
      setPaymentError(
        'Gagal memperbarui status akun. Pastikan aturan Firestore (firestore.rules) sudah di-update.'
      );
    } finally {
      setProcessing(false);
    }
  }

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
              <button
                type="button"
                onClick={() => {
                  setPaymentError(null);
                  setShowCheckout(true);
                }}
                className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
              >
                <QrCode className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Bayar & Aktifkan Premium Sekarang</span>
              </button>
            )}
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembayaran diproses langsung di dalam aplikasi. Akun otomatis aktif menjadi Premium setelah pembayaran dikonfirmasi.
            </p>
          </div>
        </article>
      </section>

      {/* Panel Pelacak Pembayaran Khusus Admin */}
      {isAdmin && (
        <section className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-[#4F46E5]" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Pelacak Transaksi & Pengguna Premium (Mode Admin)
                </h2>
                <p className="text-xs text-slate-600">
                  Total transaksi masuk: {transactions.length} · Total pemasukan: Rp
                  {(transactions.length * 19000).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              Belum ada transaksi pembayaran Premium yang tercatat di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200/80 font-semibold text-[#0F172A]">
                    <th className="py-3 px-6">Nama & Email</th>
                    <th className="py-3 px-6">Metode</th>
                    <th className="py-3 px-6">Nominal</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Waktu Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((trx) => {
                    const dateStr = trx.createdAt?.toDate
                      ? trx.createdAt.toDate().toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Baru saja';
                    return (
                      <tr key={trx.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-6">
                          <p className="font-semibold text-[#0F172A]">{trx.namaLengkap}</p>
                          <p className="text-xs text-slate-500">{trx.email}</p>
                        </td>
                        <td className="py-3 px-6 text-slate-700">{trx.metode}</td>
                        <td className="py-3 px-6 font-medium text-[#0F172A] tabular-nums">
                          Rp{trx.nominal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {trx.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-slate-600">{dateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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

      {/* Modal Checkout Pembayaran di Dalam Web */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => !processing && setShowCheckout(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-full mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Checkout Instan Lulusin
                </span>
                <h2 id="checkout-modal-title" className="text-xl font-bold text-[#0F172A]">
                  Upgrade ke Lulusin Premium
                </h2>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowCheckout(false)}
                aria-label="Tutup modal pembayaran"
                className="min-h-[40px] min-w-[40px] -mr-2 -mt-2 rounded-xl text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Tagihan */}
            <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Akun</span>
                <span className="font-medium text-[#0F172A]">
                  {firebaseUser?.email || 'Belum login'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paket</span>
                <span className="font-medium text-[#0F172A]">Premium (30 Hari)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-[#0F172A]">
                <span>Total Bayar</span>
                <span className="tabular-nums text-[#4F46E5]">Rp19.000</span>
              </div>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#0F172A]">Pilih Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {(['QRIS', 'GoPay / DANA / OVO', 'Transfer VA'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    disabled={processing}
                    onClick={() => setSelectedMethod(method)}
                    className={`px-2.5 py-2.5 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      selectedMethod === method
                        ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Tampilan QRIS Asli */}
            <div className="rounded-xl border border-dashed border-slate-300 p-4 flex flex-col items-center text-center space-y-2 bg-white">
              <img
                src="/qris-lulusin.png"
                alt="QRIS Pembayaran Lulusin"
                className="w-44 h-44 object-contain rounded-xl border border-slate-200 p-1 bg-white"
              />
              <p className="text-xs font-medium text-slate-700">
                Scan QRIS di atas dengan e-wallet atau mobile banking
              </p>
              <p className="text-[11px] text-slate-500">
                Setelah transfer selesai, klik tombol konfirmasi di bawah untuk mengaktifkan akun Premium secara otomatis.
              </p>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {paymentError}
              </div>
            )}

            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmPayment}
              className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white font-semibold text-base shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Pembayaran...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Konfirmasi Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
