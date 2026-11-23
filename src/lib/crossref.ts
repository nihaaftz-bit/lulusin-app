import { JURNAL_LIMITS, type JenisReferensi } from '../types/jurnal';
import { isValidDoiFormat, normalizeDoi, sanitizeExternalUrl } from './jurnalLogic';

export interface CrossRefAutofillData {
  judul: string;
  penulis: string[];
  tahun: string;
  jenis: JenisReferensi;
  namaSumber: string;
  volumeInfo: string;
  tautan: string;
  doi: string;
}

export type CrossRefLookupResult =
  | { ok: true; data: CrossRefAutofillData }
  | { ok: false; reason: 'invalid_doi' | 'not_found' | 'network_or_blocked' | 'invalid_response' };

interface CrossRefAuthorRaw {
  given?: unknown;
  family?: unknown;
  name?: unknown;
}

interface CrossRefMessageRaw {
  title?: unknown;
  author?: unknown;
  type?: unknown;
  'container-title'?: unknown;
  publisher?: unknown;
  volume?: unknown;
  issue?: unknown;
  page?: unknown;
  URL?: unknown;
  issued?: { 'date-parts'?: unknown };
  'published-print'?: { 'date-parts'?: unknown };
  'published-online'?: { 'date-parts'?: unknown };
  created?: { 'date-parts'?: unknown };
}

function extractYear(msg: CrossRefMessageRaw): string {
  const candidates = [msg['published-print'], msg['published-online'], msg.issued, msg.created];
  for (const cand of candidates) {
    const parts = cand?.['date-parts'];
    if (Array.isArray(parts) && Array.isArray(parts[0]) && typeof parts[0][0] === 'number') {
      return String(parts[0][0]).slice(0, JURNAL_LIMITS.tahun);
    }
  }
  return '';
}

function mapJenis(rawType: unknown): JenisReferensi {
  if (typeof rawType !== 'string') return 'lainnya';
  if (rawType.includes('journal') || rawType === 'proceedings-article') return 'jurnal';
  if (rawType.includes('book') || rawType === 'monograph') return 'buku';
  if (rawType === 'posted-content') return 'web';
  return 'lainnya';
}

export function parseCrossRefWork(
  rawMessage: unknown,
  normalizedDoi: string
): CrossRefAutofillData | null {
  if (!rawMessage || typeof rawMessage !== 'object') return null;
  const msg = rawMessage as CrossRefMessageRaw;

  const judul =
    Array.isArray(msg.title) && typeof msg.title[0] === 'string'
      ? msg.title[0].trim().slice(0, JURNAL_LIMITS.judul)
      : '';
  if (!judul) return null;

  const penulis: string[] = [];
  if (Array.isArray(msg.author)) {
    for (const a of msg.author.slice(0, JURNAL_LIMITS.penulisMax)) {
      if (!a || typeof a !== 'object') continue;
      const authorObj = a as CrossRefAuthorRaw;
      const family = typeof authorObj.family === 'string' ? authorObj.family.trim() : '';
      const given = typeof authorObj.given === 'string' ? authorObj.given.trim() : '';
      const orgName = typeof authorObj.name === 'string' ? authorObj.name.trim() : '';

      const combined = family && given ? `${given} ${family}` : family || given || orgName;
      if (combined) {
        penulis.push(combined.slice(0, JURNAL_LIMITS.penulisItem));
      }
    }
  }

  const jenis = mapJenis(msg.type);
  const containerTitle =
    Array.isArray(msg['container-title']) && typeof msg['container-title'][0] === 'string'
      ? msg['container-title'][0].trim()
      : '';
  const publisher = typeof msg.publisher === 'string' ? msg.publisher.trim() : '';
  const namaSumber = (jenis === 'buku' ? publisher || containerTitle : containerTitle || publisher).slice(
    0,
    JURNAL_LIMITS.namaSumber
  );

  const vol = typeof msg.volume === 'string' ? msg.volume.trim() : '';
  const issue = typeof msg.issue === 'string' ? msg.issue.trim() : '';
  const page = typeof msg.page === 'string' ? msg.page.trim() : '';
  let volumeInfo = '';
  if (vol && issue) {
    volumeInfo = `${vol}(${issue})`;
  } else if (vol) {
    volumeInfo = vol;
  }
  if (page) {
    volumeInfo = volumeInfo ? `${volumeInfo}, ${page}` : page;
  }
  volumeInfo = volumeInfo.slice(0, JURNAL_LIMITS.volumeInfo);

  const rawUrl = typeof msg.URL === 'string' ? msg.URL : `https://doi.org/${normalizedDoi}`;
  const tautan = (sanitizeExternalUrl(rawUrl) || `https://doi.org/${encodeURI(normalizedDoi)}`).slice(
    0,
    JURNAL_LIMITS.tautan
  );

  return {
    judul,
    penulis,
    tahun: extractYear(msg),
    jenis,
    namaSumber,
    volumeInfo,
    tautan,
    doi: normalizedDoi.slice(0, JURNAL_LIMITS.doi),
  };
}

export async function fetchCrossRefByDoi(
  rawDoi: string,
  fetchImpl: typeof fetch = fetch
): Promise<CrossRefLookupResult> {
  const normalized = normalizeDoi(rawDoi);
  if (!isValidDoiFormat(normalized)) {
    return { ok: false, reason: 'invalid_doi' };
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetchImpl(
      `https://api.crossref.org/works/${encodeURIComponent(normalized)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        reason: response.status === 404 ? 'not_found' : 'network_or_blocked',
      };
    }

    const json = (await response.json()) as { message?: unknown };
    const parsed = parseCrossRefWork(json?.message, normalized);
    if (!parsed) {
      return { ok: false, reason: 'invalid_response' };
    }

    return { ok: true, data: parsed };
  } catch {
    return { ok: false, reason: 'network_or_blocked' };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
