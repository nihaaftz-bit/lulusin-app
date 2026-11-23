import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchCrossRefByDoi, parseCrossRefWork } from '../crossref';
import {
  filterReferensi,
  formatAuthorApa7,
  formatSitasiAPA7,
  sanitizeExternalUrl,
} from '../jurnalLogic';
import type { ReferensiRecord } from '../../types/jurnal';

describe('formatSitasiAPA7 & formatAuthorApa7', () => {
  it('memformat nama penulis Indonesia dan Barat ke standar APA 7', () => {
    assert.equal(formatAuthorApa7('Nadia Putri Pratama'), 'Pratama, N. P.');
    assert.equal(formatAuthorApa7('Santoso, B.'), 'Santoso, B.');
    assert.equal(formatAuthorApa7('Sugiyono'), 'Sugiyono');
  });

  it('menghasilkan sitasi APA 7 yang tepat untuk contoh 1: JURNAL', () => {
    const sitasiJurnal = formatSitasiAPA7({
      judul: 'Pengaruh kualitas tidur terhadap fokus belajar mahasiswa tingkat akhir',
      penulis: ['Nadia Putri Pratama', 'Budi Santoso'],
      tahun: '2024',
      jenis: 'jurnal',
      namaSumber: 'Jurnal Psikologi Pendidikan Indonesia',
      volumeInfo: '12(2), 45-58',
      tautan: '',
      doi: 'https://doi.org/10.1234/jppi.2024.122',
    });

    assert.equal(
      sitasiJurnal,
      'Pratama, N. P., & Santoso, B. (2024). Pengaruh kualitas tidur terhadap fokus belajar mahasiswa tingkat akhir. Jurnal Psikologi Pendidikan Indonesia, 12(2), 45-58. https://doi.org/10.1234/jppi.2024.122'
    );
  });

  it('menghasilkan sitasi APA 7 yang tepat untuk contoh 2: BUKU', () => {
    const sitasiBuku = formatSitasiAPA7({
      judul: 'Metode penelitian kuantitatif, kualitatif, dan R&D',
      penulis: ['Sugiyono'],
      tahun: '2022',
      jenis: 'buku',
      namaSumber: 'Alfabeta',
      volumeInfo: '',
      tautan: '',
      doi: '',
    });

    assert.equal(
      sitasiBuku,
      'Sugiyono. (2022). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.'
    );
  });

  it('menghasilkan sitasi APA 7 yang tepat untuk contoh 3: WEB', () => {
    const sitasiWeb = formatSitasiAPA7({
      judul: 'Pedoman penulisan karya ilmiah mahasiswa sarjana',
      penulis: ['Rina Wulandari'],
      tahun: '2025',
      jenis: 'web',
      namaSumber: 'Portal Akademik Kampus',
      volumeInfo: '',
      tautan: 'https://kampus.ac.id/pedoman-skripsi',
      doi: '',
    });

    assert.equal(
      sitasiWeb,
      'Wulandari, R. (2025). Pedoman penulisan karya ilmiah mahasiswa sarjana. Portal Akademik Kampus. https://kampus.ac.id/pedoman-skripsi'
    );
  });

  it('memblokir skema tautan berbahaya dan memakai n.d. jika tahun kosong', () => {
    assert.equal(sanitizeExternalUrl('javascript:alert(1)'), '');
    assert.equal(sanitizeExternalUrl('https://scholar.google.com/'), 'https://scholar.google.com/');

    const sitasiTanpaTahun = formatSitasiAPA7({
      judul: 'Ringkasan data statistik pendidikan',
      penulis: [],
      tahun: '',
      jenis: 'web',
      namaSumber: 'BPS',
      volumeInfo: '',
      tautan: 'https://bps.go.id/data',
      doi: '',
    });
    assert.equal(
      sitasiTanpaTahun,
      'Ringkasan data statistik pendidikan. (n.d.). BPS. https://bps.go.id/data'
    );
  });
});

describe('filterReferensi pada 100 data contoh', () => {
  const sample100: ReferensiRecord[] = Array.from({ length: 100 }, (_, i) => ({
    uid: 'user-1',
    referensiId: `ref_${i + 1}`,
    judul:
      i === 42
        ? 'Analisis regresi linear pada mahasiswa tingkat akhir'
        : `Studi literatur topik skripsi nomor ${i + 1}`,
    penulis: i === 42 ? ['Hendra Wijaya', 'Siti Aminah'] : [`Penulis ${i + 1}`],
    tahun: String(2015 + (i % 10)),
    jenis: i % 3 === 0 ? 'jurnal' : i % 3 === 1 ? 'buku' : 'web',
    namaSumber: `Sumber ${i + 1}`,
    volumeInfo: '',
    tautan: '',
    doi: '',
    catatan: i === 42 ? 'Penting untuk Bab 3 metode kuantitatif' : 'Referensi pendukung',
    tag: i % 2 === 0 ? ['bab2', 'metodologi'] : ['bab1', 'pendahuluan'],
    statusBaca: i % 4 === 0 ? 'Sudah dibaca' : 'Belum dibaca',
  }));

  it('menyaring 100 data contoh berdasarkan kata kunci dan tag dengan cepat dan akurat', () => {
    const start = performance.now();
    const hasilSearch = filterReferensi(sample100, {
      query: 'regresi linear',
      tag: 'metodologi',
      statusBaca: 'ALL',
      jenis: 'ALL',
    });
    const hasilTagSaja = filterReferensi(sample100, {
      query: '',
      tag: 'bab1',
      statusBaca: 'Belum dibaca',
      jenis: 'ALL',
    });
    const elapsedMs = performance.now() - start;

    assert.equal(hasilSearch.length, 1);
    assert.equal(hasilSearch[0].referensiId, 'ref_43');
    assert.ok(hasilTagSaja.length > 0);
    assert.ok(elapsedMs < 50, `Filter 100 item memakan waktu terlalu lama: ${elapsedMs}ms`);
  });
});

describe('Crossref DOI autofill & kegagalan aman', () => {
  it('memparsing payload Crossref valid ke struktur form referensi', () => {
    const parsed = parseCrossRefWork(
      {
        title: ['Sleep quality and academic stress among undergraduate students'],
        author: [
          { given: 'Nadia', family: 'Pratama' },
          { given: 'Budi', family: 'Santoso' },
        ],
        type: 'journal-article',
        'container-title': ['Journal of Student Wellbeing'],
        volume: '8',
        issue: '1',
        page: '12-24',
        'published-online': { 'date-parts': [[2024, 5, 10]] },
        URL: 'https://doi.org/10.5555/jsw.2024.81',
      },
      '10.5555/jsw.2024.81'
    );

    assert.ok(parsed);
    assert.equal(parsed.judul, 'Sleep quality and academic stress among undergraduate students');
    assert.deepEqual(parsed.penulis, ['Nadia Pratama', 'Budi Santoso']);
    assert.equal(parsed.tahun, '2024');
    assert.equal(parsed.jenis, 'jurnal');
    assert.equal(parsed.namaSumber, 'Journal of Student Wellbeing');
    assert.equal(parsed.volumeInfo, '8(1), 12-24');
  });

  it('gagal dengan aman tanpa throw ketika DOI tidak valid, 404, atau jaringan error', async () => {
    const invalidResult = await fetchCrossRefByDoi('bukan-doi');
    assert.deepEqual(invalidResult, { ok: false, reason: 'invalid_doi' });

    const notFoundResult = await fetchCrossRefByDoi('10.1234/tidak-ada', (async () => ({
      ok: false,
      status: 404,
    })) as unknown as typeof fetch);
    assert.deepEqual(notFoundResult, { ok: false, reason: 'not_found' });

    const networkErrResult = await fetchCrossRefByDoi('10.1234/offline', (async () => {
      throw new Error('Network blocked');
    }) as unknown as typeof fetch);
    assert.deepEqual(networkErrResult, { ok: false, reason: 'network_or_blocked' });
  });
});
