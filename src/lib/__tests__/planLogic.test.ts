import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computePremiumUntilIso,
  dismissUpgradeBanner,
  filterAdminUsers,
  isAdminEmail,
  resolveEffectivePlan,
  shouldShowUpgradeBanner,
  type SafeAdminUserRow,
} from '../planLogic';

describe('resolveEffectivePlan', () => {
  it('mengembalikan free untuk akun gratis standar', () => {
    const res = resolveEffectivePlan({
      plan: 'free',
      premiumUntil: null,
      sumberPremium: null,
    });
    assert.equal(res.effectivePlan, 'free');
    assert.equal(res.isExpired, false);
    assert.equal(res.sisaHari, null);
  });

  it('mengembalikan premium beserta sisa hari saat premiumUntil masih di masa depan', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');
    const res = resolveEffectivePlan(
      {
        plan: 'premium',
        premiumUntil: '2026-11-16T00:00:00.000Z',
        sumberPremium: 'manual',
      },
      now
    );
    assert.equal(res.effectivePlan, 'premium');
    assert.equal(res.isExpired, false);
    assert.equal(res.sisaHari, 15);
    assert.equal(res.sumberPremium, 'manual');
  });

  it('menganggap paket sebagai free ketika plan == premium namun premiumUntil sudah lewat', () => {
    const now = new Date('2026-12-02T00:00:00.000Z');
    const res = resolveEffectivePlan(
      {
        plan: 'premium',
        premiumUntil: '2026-12-01T23:59:59.000Z',
        sumberPremium: 'bayar',
      },
      now
    );
    assert.equal(res.effectivePlan, 'free');
    assert.equal(res.rawPlan, 'premium');
    assert.equal(res.isExpired, true);
    assert.equal(res.sisaHari, 0);
  });
});

describe('aturan banner upgrade 7 hari di localStorage', () => {
  it('menyembunyikan banner selama 7 hari setelah ditutup dan tampil lagi setelah 7 hari', () => {
    const mem = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
    };

    const t0 = Date.parse('2026-11-01T00:00:00.000Z');
    assert.equal(shouldShowUpgradeBanner('uid1', t0, mockStorage), true);

    dismissUpgradeBanner('uid1', t0, mockStorage);
    const hariKe3 = t0 + 3 * 24 * 60 * 60 * 1000;
    assert.equal(shouldShowUpgradeBanner('uid1', hariKe3, mockStorage), false);

    const hariKe7 = t0 + 7 * 24 * 60 * 60 * 1000;
    assert.equal(shouldShowUpgradeBanner('uid1', hariKe7, mockStorage), true);
  });
});

describe('admin helpers & filterAdminUsers', () => {
  it('memvalidasi email admin secara case-insensitive', () => {
    assert.equal(isAdminEmail('nihaaftz@gmail.com'), true);
    assert.equal(isAdminEmail('Nihaaftz@Gmail.COM '), true);
    assert.equal(isAdminEmail('mahasiswa@ui.ac.id'), false);
    assert.equal(isAdminEmail(null), false);
  });

  it('menghitung tanggal berakhir tepat N hari ke depan', () => {
    const base = new Date('2026-11-01T10:00:00.000Z');
    const until = computePremiumUntilIso(30, base);
    assert.equal(until, '2026-12-01T10:00:00.000Z');
  });

  it('menyaring daftar pengguna berdasarkan kata kunci dan status paket', () => {
    const now = new Date('2026-11-15T00:00:00.000Z');
    const sample: SafeAdminUserRow[] = [
      {
        uid: 'u1',
        namaLengkap: 'Nadia Putri',
        email: 'nadia@ui.ac.id',
        universitas: 'Universitas Indonesia',
        prodi: 'Ilmu Komunikasi',
        plan: 'premium',
        premiumUntil: '2026-12-01T00:00:00.000Z',
        sumberPremium: 'manual',
        createdAtIso: '2026-11-01T00:00:00.000Z',
      },
      {
        uid: 'u2',
        namaLengkap: 'Bagas Pratama',
        email: 'bagas@ugm.ac.id',
        universitas: 'Universitas Gadjah Mada',
        prodi: 'Teknik Informatika',
        plan: 'free',
        premiumUntil: null,
        sumberPremium: null,
        createdAtIso: '2026-11-02T00:00:00.000Z',
      },
      {
        uid: 'u3',
        namaLengkap: 'Rina Sari',
        email: 'rina@itb.ac.id',
        universitas: 'Institut Teknologi Bandung',
        prodi: 'Manajemen',
        plan: 'premium',
        premiumUntil: '2026-11-10T00:00:00.000Z',
        sumberPremium: 'trial',
        createdAtIso: '2026-10-10T00:00:00.000Z',
      },
    ];

    assert.equal(filterAdminUsers(sample, '', 'semua', now).length, 3);
    assert.equal(filterAdminUsers(sample, '', 'premium_aktif', now).map((r) => r.uid)[0], 'u1');
    assert.equal(filterAdminUsers(sample, '', 'premium_berakhir', now).map((r) => r.uid)[0], 'u3');
    assert.equal(filterAdminUsers(sample, 'gadjah mada', 'semua', now).map((r) => r.uid)[0], 'u2');
  });
});
