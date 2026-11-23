import type { BimbinganRecord, RevisiRecord } from '../types/bimbinganRevisi';
import type {
  BimbinganJadwalItem,
  RevisiItem,
  RoadmapTahap,
  RoadmapTugas,
  StatusTahap,
} from '../types/roadmap';
import type { UserProfile } from '../types/user';

export interface ProgresSkripsiResult {
  selesai: number;
  total: number;
  persen: number | null;
}

export type LangkahBerikutnya =
  | {
      jenis: 'bimbingan';
      judul: string;
      dosen?: string;
      keterangan: string;
      tanggalIso: string;
      route: '/bimbingan';
    }
  | {
      jenis: 'revisi';
      judul: string;
      sumber?: string;
      keterangan: string;
      tenggat: string;
      route: '/revisi';
    }
  | {
      jenis: 'roadmap_tenggat';
      judul: string;
      namaTahap: string;
      tenggat: string;
      tugasId: string;
      route: '/roadmap';
    }
  | {
      jenis: 'roadmap_tahap_aktif';
      judul: string;
      namaTahap: string;
      tugasId: string;
      route: '/roadmap';
    }
  | {
      jenis: 'kosong';
      judul: string;
      keterangan: string;
      route: '/roadmap';
    };

export interface TenggatMendatangItem {
  tugasId: string;
  judul: string;
  namaTahap: string;
  tenggat: string;
  sisaHari: number;
}

export interface HitungMundurSidangResult {
  hariTersisa: number;
  status: 'mendatang' | 'hari_ini' | 'terlewat';
}

export type FieldOpsionalProfilKey =
  | 'dosenPembimbing1'
  | 'judulSkripsi'
  | 'targetSidang'
  | 'semester'
  | 'fakultas';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDateStartLocal(isoDate: string): Date | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function hitungStatusTahap(tugasDiTahap: Pick<RoadmapTugas, 'selesai'>[]): StatusTahap {
  if (tugasDiTahap.length === 0) return 'belum_mulai';
  const jumlahSelesai = tugasDiTahap.filter((t) => t.selesai).length;
  if (jumlahSelesai === tugasDiTahap.length) return 'selesai';
  if (jumlahSelesai > 0) return 'sedang_berjalan';
  return 'belum_mulai';
}

export function hitungProgresSkripsi(
  tahapList: Pick<RoadmapTahap, 'tahapId' | 'tersembunyi'>[],
  tugasList: Pick<RoadmapTugas, 'tahapId' | 'selesai'>[]
): ProgresSkripsiResult {
  const visibleTahapIds = new Set(
    tahapList.filter((tahap) => !tahap.tersembunyi).map((tahap) => tahap.tahapId)
  );
  const visibleTugas = tugasList.filter((tugas) => visibleTahapIds.has(tugas.tahapId));

  const total = visibleTugas.length;
  if (total === 0) {
    return { selesai: 0, total: 0, persen: null };
  }

  const selesai = visibleTugas.filter((tugas) => tugas.selesai).length;
  return {
    selesai,
    total,
    persen: Math.round((selesai / total) * 100),
  };
}

export function cariTahapAktif<T extends Pick<RoadmapTahap, 'tahapId' | 'urutan' | 'tersembunyi'>>(
  tahapList: T[],
  tugasList: Pick<RoadmapTugas, 'tahapId' | 'selesai'>[]
): T | null {
  const visibleSorted = [...tahapList]
    .filter((t) => !t.tersembunyi)
    .sort((a, b) => a.urutan - b.urutan);

  for (const tahap of visibleSorted) {
    const punyaBelumSelesai = tugasList.some(
      (tugas) => tugas.tahapId === tahap.tahapId && !tugas.selesai
    );
    if (punyaBelumSelesai) {
      return tahap;
    }
  }

  return null;
}

export function pilihLangkahBerikutnya(params: {
  now?: Date;
  tahapList: RoadmapTahap[];
  tugasList: RoadmapTugas[];
  bimbinganList?: BimbinganJadwalItem[];
  revisiList?: RevisiItem[];
}): LangkahBerikutnya {
  const now = params.now ?? new Date();
  const nowMs = now.getTime();
  const batas48JamMs = nowMs + 48 * 60 * 60 * 1000;

  // Prioritas 1: Bimbingan terjadwal dalam 48 jam ke depan
  const bimbinganDekat = (params.bimbinganList ?? [])
    .filter((item) => !item.selesai && item.tanggalIso)
    .map((item) => ({ item, timeMs: new Date(item.tanggalIso).getTime() }))
    .filter(({ timeMs }) => !Number.isNaN(timeMs) && timeMs >= nowMs && timeMs <= batas48JamMs)
    .sort((a, b) => a.timeMs - b.timeMs);

  if (bimbinganDekat.length > 0) {
    const terpilih = bimbinganDekat[0].item;
    return {
      jenis: 'bimbingan',
      judul: terpilih.judul,
      dosen: terpilih.dosen,
      keterangan: 'Bimbingan terjadwal dalam 48 jam ke depan',
      tanggalIso: terpilih.tanggalIso,
      route: '/bimbingan',
    };
  }

  // Prioritas 2: Revisi prioritas Tinggi belum selesai dengan tenggat terdekat
  const revisiTinggi = (params.revisiList ?? [])
    .filter((item) => !item.selesai && item.prioritas === 'Tinggi')
    .sort((a, b) => {
      if (a.tenggat && b.tenggat) return a.tenggat.localeCompare(b.tenggat);
      if (a.tenggat) return -1;
      if (b.tenggat) return 1;
      return a.judul.localeCompare(b.judul);
    });

  if (revisiTinggi.length > 0) {
    const terpilih = revisiTinggi[0];
    return {
      jenis: 'revisi',
      judul: terpilih.judul,
      sumber: terpilih.sumber,
      keterangan: 'Revisi prioritas tinggi yang perlu segera dituntaskan',
      tenggat: terpilih.tenggat,
      route: '/revisi',
    };
  }

  const visibleTahapMap = new Map<string, RoadmapTahap>();
  for (const tahap of params.tahapList) {
    if (!tahap.tersembunyi) {
      visibleTahapMap.set(tahap.tahapId, tahap);
    }
  }

  // Prioritas 3: Tugas Roadmap belum selesai dengan tenggat terdekat
  const tugasBertenggat = params.tugasList
    .filter((tugas) => !tugas.selesai && Boolean(tugas.tenggat) && visibleTahapMap.has(tugas.tahapId))
    .sort((a, b) => {
      const cmpTanggal = a.tenggat.localeCompare(b.tenggat);
      if (cmpTanggal !== 0) return cmpTanggal;
      const tahapA = visibleTahapMap.get(a.tahapId)?.urutan ?? 0;
      const tahapB = visibleTahapMap.get(b.tahapId)?.urutan ?? 0;
      if (tahapA !== tahapB) return tahapA - tahapB;
      return a.urutan - b.urutan;
    });

  if (tugasBertenggat.length > 0) {
    const terpilih = tugasBertenggat[0];
    const tahap = visibleTahapMap.get(terpilih.tahapId);
    return {
      jenis: 'roadmap_tenggat',
      judul: terpilih.judul,
      namaTahap: tahap?.judul ?? '',
      tenggat: terpilih.tenggat,
      tugasId: terpilih.tugasId,
      route: '/roadmap',
    };
  }

  // Prioritas 4: Tugas belum selesai pertama di tahap aktif
  const tahapAktif = cariTahapAktif(params.tahapList, params.tugasList);
  if (tahapAktif) {
    const tugasAktif = params.tugasList
      .filter((tugas) => tugas.tahapId === tahapAktif.tahapId && !tugas.selesai)
      .sort((a, b) => a.urutan - b.urutan);

    if (tugasAktif.length > 0) {
      const terpilih = tugasAktif[0];
      return {
        jenis: 'roadmap_tahap_aktif',
        judul: terpilih.judul,
        namaTahap: tahapAktif.judul,
        tugasId: terpilih.tugasId,
        route: '/roadmap',
      };
    }
  }

  // Prioritas 5: Jika kosong, ajakan menambah tugas pertama
  return {
    jenis: 'kosong',
    judul: 'Tambahkan tugas pertamamu di Roadmap',
    keterangan:
      'Belum ada tugas aktif yang tersisa. Mulai tambah tugas baru atau tampilkan tahap yang kamu perlukan.',
    route: '/roadmap',
  };
}

export function ambilTenggatMendatang(
  tahapList: RoadmapTahap[],
  tugasList: RoadmapTugas[],
  now: Date = new Date(),
  rentangHari = 7
): TenggatMendatangItem[] {
  const todayStr = toLocalIsoDate(now);
  const todayStart = parseIsoDateStartLocal(todayStr);
  if (!todayStart) return [];

  const visibleTahapMap = new Map<string, RoadmapTahap>();
  for (const tahap of tahapList) {
    if (!tahap.tersembunyi) {
      visibleTahapMap.set(tahap.tahapId, tahap);
    }
  }

  const hasil: TenggatMendatangItem[] = [];

  for (const tugas of tugasList) {
    if (tugas.selesai || !tugas.tenggat) continue;
    const tahap = visibleTahapMap.get(tugas.tahapId);
    if (!tahap) continue;

    const dueDate = parseIsoDateStartLocal(tugas.tenggat);
    if (!dueDate) continue;

    const diffDays = Math.round((dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays >= 0 && diffDays <= rentangHari) {
      hasil.push({
        tugasId: tugas.tugasId,
        judul: tugas.judul,
        namaTahap: tahap.judul,
        tenggat: tugas.tenggat,
        sisaHari: diffDays,
      });
    }
  }

  return hasil.sort((a, b) => a.tenggat.localeCompare(b.tenggat));
}

export function hitungMundurSidang(
  targetSidang: string,
  now: Date = new Date()
): HitungMundurSidangResult | null {
  if (!targetSidang) return null;
  const targetDate = parseIsoDateStartLocal(targetSidang);
  const todayDate = parseIsoDateStartLocal(toLocalIsoDate(now));
  if (!targetDate || !todayDate) return null;

  const diffDays = Math.round(
    (targetDate.getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays > 0) {
    return { hariTersisa: diffDays, status: 'mendatang' };
  }
  if (diffDays === 0) {
    return { hariTersisa: 0, status: 'hari_ini' };
  }
  return { hariTersisa: Math.abs(diffDays), status: 'terlewat' };
}

export function ambilFieldProfilKosong(
  profile: Pick<
    UserProfile,
    'judulSkripsi' | 'dosenPembimbing1' | 'targetSidang' | 'semester' | 'fakultas'
  > | null
): FieldOpsionalProfilKey[] {
  if (!profile) return [];
  const kosong: FieldOpsionalProfilKey[] = [];
  if (!profile.dosenPembimbing1.trim()) kosong.push('dosenPembimbing1');
  if (!profile.judulSkripsi.trim()) kosong.push('judulSkripsi');
  if (!profile.targetSidang.trim()) kosong.push('targetSidang');
  if (!profile.semester.trim()) kosong.push('semester');
  if (!profile.fakultas.trim()) kosong.push('fakultas');
  return kosong;
}

export function kelompokkanBimbingan<
  T extends Pick<BimbinganRecord, 'tanggalIso' | 'selesai'>
>(list: T[], now: Date = new Date()): { akanDatang: T[]; riwayat: T[] } {
  const nowMs = now.getTime();
  const akanDatang: T[] = [];
  const riwayat: T[] = [];

  for (const item of list) {
    const timeMs = new Date(item.tanggalIso).getTime();
    if (!item.selesai && !Number.isNaN(timeMs) && timeMs >= nowMs) {
      akanDatang.push(item);
    } else {
      riwayat.push(item);
    }
  }

  akanDatang.sort((a, b) => a.tanggalIso.localeCompare(b.tanggalIso));
  riwayat.sort((a, b) => b.tanggalIso.localeCompare(a.tanggalIso));

  return { akanDatang, riwayat };
}

export function hitungRingkasanRevisi(
  list: Pick<RevisiRecord, 'status' | 'prioritas'>[]
): { total: number; belumSelesai: number; prioritasTinggiBelumSelesai: number } {
  let belumSelesai = 0;
  let prioritasTinggiBelumSelesai = 0;

  for (const item of list) {
    if (item.status !== 'Selesai') {
      belumSelesai += 1;
      if (item.prioritas === 'Tinggi') {
        prioritasTinggiBelumSelesai += 1;
      }
    }
  }

  return {
    total: list.length,
    belumSelesai,
    prioritasTinggiBelumSelesai,
  };
}
