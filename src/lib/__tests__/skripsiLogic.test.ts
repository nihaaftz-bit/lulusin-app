import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ambilFieldProfilKosong,
  ambilTenggatMendatang,
  cariTahapAktif,
  hitungMundurSidang,
  hitungProgresSkripsi,
  hitungRingkasanRevisi,
  hitungStatusTahap,
  kelompokkanBimbingan,
  pilihLangkahBerikutnya,
} from '../skripsiLogic.ts';
import type { RoadmapTahap, RoadmapTugas } from '../../types/roadmap.ts';

function buatTahap(
  tahapId: string,
  judul: string,
  urutan: number,
  tersembunyi = false
): RoadmapTahap {
  return {
    uid: 'user-1',
    tahapId,
    judul,
    deskripsi: '',
    urutan,
    tersembunyi,
    sumberTemplate: 'Kuantitatif',
  };
}

function buatTugas(
  tugasId: string,
  tahapId: string,
  judul: string,
  urutan: number,
  selesai = false,
  tenggat = ''
): RoadmapTugas {
  return {
    uid: 'user-1',
    tugasId,
    tahapId,
    judul,
    selesai,
    tenggat,
    urutan,
  };
}

describe('hitungProgresSkripsi & hitungStatusTahap', () => {
  it('mengembalikan persen null ketika tidak ada tugas di tahap yang tampil', () => {
    const tahap = [buatTahap('t1', 'Pengajuan Topik', 0, true)];
    const tugas = [buatTugas('g1', 't1', 'Cari jurnal', 0, true)];

    const hasil = hitungProgresSkripsi(tahap, tugas);
    assert.equal(hasil.total, 0);
    assert.equal(hasil.selesai, 0);
    assert.equal(hasil.persen, null);
  });

  it('mengabaikan tahap tersembunyi dari pembilang dan penyebut', () => {
    const tahap = [
      buatTahap('t1', 'Pengajuan Topik', 0, false),
      buatTahap('t2', 'Seminar Proposal', 1, true),
      buatTahap('t3', 'Pengumpulan Data', 2, false),
    ];
    const tugas = [
      buatTugas('g1', 't1', 'Tugas 1', 0, true),
      buatTugas('g2', 't1', 'Tugas 2', 1, false),
      buatTugas('g3', 't2', 'Tugas Tersembunyi', 0, true),
      buatTugas('g4', 't3', 'Tugas 3', 0, true),
    ];

    const hasil = hitungProgresSkripsi(tahap, tugas);
    assert.equal(hasil.selesai, 2);
    assert.equal(hasil.total, 3);
    assert.equal(hasil.persen, 67);
  });

  it('menghitung status tahap dengan benar', () => {
    assert.equal(hitungStatusTahap([]), 'belum_mulai');
    assert.equal(hitungStatusTahap([{ selesai: false }, { selesai: false }]), 'belum_mulai');
    assert.equal(hitungStatusTahap([{ selesai: true }, { selesai: false }]), 'sedang_berjalan');
    assert.equal(hitungStatusTahap([{ selesai: true }, { selesai: true }]), 'selesai');
  });
});

describe('cariTahapAktif & pilihLangkahBerikutnya', () => {
  const now = new Date(2026, 10, 23, 9, 0, 0);

  it('memilih tahap aktif pertama yang tidak tersembunyi dan masih punya tugas belum selesai', () => {
    const tahap = [
      buatTahap('t1', 'Pengajuan Topik', 0, false),
      buatTahap('t2', 'Proposal', 1, true),
      buatTahap('t3', 'Pengumpulan Data', 2, false),
    ];
    const tugas = [
      buatTugas('g1', 't1', 'Selesai semua', 0, true),
      buatTugas('g2', 't2', 'Tersembunyi belum selesai', 0, false),
      buatTugas('g3', 't3', 'Tugas aktif', 0, false),
    ];

    const aktif = cariTahapAktif(tahap, tugas);
    assert.equal(aktif?.tahapId, 't3');
  });

  it('memprioritaskan (1) bimbingan dalam 48 jam dibanding prioritas lain', () => {
    const tahap = [buatTahap('t1', 'Proposal', 0)];
    const tugas = [buatTugas('g1', 't1', 'Tulis Bab 1', 0, false, '2026-11-23')];

    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: tahap,
      tugasList: tugas,
      bimbinganList: [
        {
          id: 'b1',
          judul: 'Bimbingan Bab 1 dengan Bu Rina',
          dosen: 'Dr. Rina',
          tanggalIso: new Date(2026, 10, 24, 10, 0, 0).toISOString(),
          selesai: false,
        },
      ],
      revisiList: [
        {
          id: 'r1',
          judul: 'Perbaiki rumusan masalah',
          prioritas: 'Tinggi',
          tenggat: '2026-11-23',
          selesai: false,
        },
      ],
    });

    assert.equal(langkah.jenis, 'bimbingan');
    assert.equal(langkah.judul, 'Bimbingan Bab 1 dengan Bu Rina');
  });

  it('memprioritaskan (2) revisi Tinggi terdekat jika tidak ada bimbingan <= 48 jam', () => {
    const tahap = [buatTahap('t1', 'Proposal', 0)];
    const tugas = [buatTugas('g1', 't1', 'Tulis Bab 1', 0, false, '2026-11-23')];

    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: tahap,
      tugasList: tugas,
      bimbinganList: [
        {
          id: 'b1',
          judul: 'Bimbingan minggu depan',
          tanggalIso: new Date(2026, 10, 30, 10, 0, 0).toISOString(),
          selesai: false,
        },
      ],
      revisiList: [
        {
          id: 'r2',
          judul: 'Revisi daftar pustaka',
          prioritas: 'Tinggi',
          tenggat: '2026-11-28',
          selesai: false,
        },
        {
          id: 'r1',
          judul: 'Perbaiki rumusan masalah',
          prioritas: 'Tinggi',
          tenggat: '2026-11-25',
          selesai: false,
        },
      ],
    });

    assert.equal(langkah.jenis, 'revisi');
    assert.equal(langkah.judul, 'Perbaiki rumusan masalah');
  });

  it('tidak memprioritaskan revisi Sedang atau Tinggi yang sudah selesai di atas tugas Roadmap', () => {
    const tahap = [buatTahap('t1', 'Proposal', 0)];
    const tugas = [buatTugas('g1', 't1', 'Tulis Bab 1', 0, false, '2026-11-25')];

    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: tahap,
      tugasList: tugas,
      revisiList: [
        {
          id: 'r1',
          judul: 'Revisi Tinggi sudah selesai',
          prioritas: 'Tinggi',
          tenggat: '2026-11-23',
          selesai: true,
        },
        {
          id: 'r2',
          judul: 'Revisi Sedang belum selesai',
          prioritas: 'Sedang',
          tenggat: '2026-11-23',
          selesai: false,
        },
      ],
    });

    assert.equal(langkah.jenis, 'roadmap_tenggat');
  });

  it('memprioritaskan (3) tugas Roadmap bertenggat terdekat pada tahap yang tidak disembunyikan', () => {
    const tahap = [
      buatTahap('t1', 'Pengajuan Topik', 0, false),
      buatTahap('t2', 'Proposal', 1, false),
    ];
    const tugas = [
      buatTugas('g1', 't1', 'Tugas tanpa tenggat', 0, false, ''),
      buatTugas('g2', 't2', 'Tulis Bab 1', 0, false, '2026-11-27'),
      buatTugas('g3', 't2', 'Rapikan referensi', 1, false, '2026-11-25'),
    ];

    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: tahap,
      tugasList: tugas,
    });

    assert.equal(langkah.jenis, 'roadmap_tenggat');
    if (langkah.jenis === 'roadmap_tenggat') {
      assert.equal(langkah.tugasId, 'g3');
      assert.equal(langkah.tenggat, '2026-11-25');
    }
  });

  it('memprioritaskan (4) tugas belum selesai pertama di tahap aktif jika tidak ada tenggat', () => {
    const tahap = [
      buatTahap('t1', 'Pengajuan Topik', 0, false),
      buatTahap('t2', 'Proposal', 1, false),
    ];
    const tugas = [
      buatTugas('g1', 't1', 'Sudah selesai', 0, true),
      buatTugas('g2', 't2', 'Tugas pertama Bab 1', 0, false),
      buatTugas('g3', 't2', 'Tugas kedua Bab 2', 1, false),
    ];

    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: tahap,
      tugasList: tugas,
    });

    assert.equal(langkah.jenis, 'roadmap_tahap_aktif');
    if (langkah.jenis === 'roadmap_tahap_aktif') {
      assert.equal(langkah.tugasId, 'g2');
      assert.equal(langkah.namaTahap, 'Proposal');
    }
  });

  it('memprioritaskan (5) ajakan menambah tugas pertama saat tidak ada tugas aktif', () => {
    const langkah = pilihLangkahBerikutnya({
      now,
      tahapList: [],
      tugasList: [],
    });

    assert.equal(langkah.jenis, 'kosong');
  });
});

describe('kelompokkanBimbingan & hitungRingkasanRevisi', () => {
  const now = new Date(2026, 10, 23, 9, 0, 0);

  it('membagi bimbingan ke Akan datang dan Riwayat dengan urutan tepat', () => {
    const { akanDatang, riwayat } = kelompokkanBimbingan(
      [
        { tanggalIso: new Date(2026, 10, 26, 10, 0, 0).toISOString(), selesai: false },
        { tanggalIso: new Date(2026, 10, 24, 10, 0, 0).toISOString(), selesai: false },
        { tanggalIso: new Date(2026, 10, 24, 14, 0, 0).toISOString(), selesai: true },
        { tanggalIso: new Date(2026, 10, 20, 10, 0, 0).toISOString(), selesai: false },
      ],
      now
    );

    assert.equal(akanDatang.length, 2);
    assert.equal(riwayat.length, 2);
    assert.ok(akanDatang[0].tanggalIso < akanDatang[1].tanggalIso);
    assert.ok(riwayat[0].tanggalIso > riwayat[1].tanggalIso);
  });

  it('menghitung jumlah revisi belum selesai dan prioritas tinggi', () => {
    const ringkasan = hitungRingkasanRevisi([
      { status: 'Belum', prioritas: 'Tinggi' },
      { status: 'Dikerjakan', prioritas: 'Tinggi' },
      { status: 'Belum', prioritas: 'Sedang' },
      { status: 'Selesai', prioritas: 'Tinggi' },
    ]);

    assert.equal(ringkasan.total, 4);
    assert.equal(ringkasan.belumSelesai, 3);
    assert.equal(ringkasan.prioritasTinggiBelumSelesai, 2);
  });
});

describe('ambilTenggatMendatang, hitungMundurSidang & ambilFieldProfilKosong', () => {
  const now = new Date(2026, 10, 23, 9, 0, 0);

  it('mengambil tenggat dalam 7 hari ke depan dari tahap yang terlihat', () => {
    const tahap = [
      buatTahap('t1', 'Proposal', 0, false),
      buatTahap('t2', 'Tersembunyi', 1, true),
    ];
    const tugas = [
      buatTugas('g1', 't1', 'Hari ini', 0, false, '2026-11-23'),
      buatTugas('g2', 't1', 'Hari ke-7', 1, false, '2026-11-30'),
      buatTugas('g3', 't1', 'Hari ke-8 (terlalu jauh)', 2, false, '2026-12-01'),
      buatTugas('g4', 't1', 'Sudah selesai', 3, true, '2026-11-24'),
      buatTugas('g5', 't2', 'Di tahap tersembunyi', 0, false, '2026-11-24'),
    ];

    const tenggat = ambilTenggatMendatang(tahap, tugas, now, 7);
    assert.deepEqual(
      tenggat.map((t) => t.tugasId),
      ['g1', 'g2']
    );
  });

  it('menghitung mundur target tanggal sidang', () => {
    assert.deepEqual(hitungMundurSidang('2026-11-30', now), {
      hariTersisa: 7,
      status: 'mendatang',
    });
    assert.deepEqual(hitungMundurSidang('2026-11-23', now), {
      hariTersisa: 0,
      status: 'hari_ini',
    });
    assert.deepEqual(hitungMundurSidang('2026-11-20', now), {
      hariTersisa: 3,
      status: 'terlewat',
    });
    assert.equal(hitungMundurSidang('', now), null);
  });

  it('mendeteksi field opsional profil yang masih kosong', () => {
    const kosong = ambilFieldProfilKosong({
      judulSkripsi: '',
      dosenPembimbing1: 'Dr. Budi',
      targetSidang: '',
      semester: '8',
      fakultas: 'FISIP',
    });
    assert.deepEqual(kosong, ['judulSkripsi', 'targetSidang']);

    const lengkap = ambilFieldProfilKosong({
      judulSkripsi: 'Analisis Sosial',
      dosenPembimbing1: 'Dr. Budi',
      targetSidang: '2027-02-15',
      semester: '8',
      fakultas: 'FISIP',
    });
    assert.deepEqual(lengkap, []);
  });
});
