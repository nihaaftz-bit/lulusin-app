import type { JenisReferensi, ReferensiRecord, StatusBacaReferensi } from '../types/jurnal';

const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

export function normalizeDoi(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

export function isValidDoiFormat(raw: string): boolean {
  const normalized = normalizeDoi(raw);
  return Boolean(normalized) && DOI_REGEX.test(normalized);
}

/**
 * Memastikan hanya tautan http/https yang boleh dibuka agar aman dari XSS/skema berbahaya.
 */
export function sanitizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

export function buildReferensiHref(tautan: string, doi: string): string {
  const safeUrl = sanitizeExternalUrl(tautan);
  if (safeUrl) return safeUrl;
  const normalizedDoi = normalizeDoi(doi);
  if (normalizedDoi && DOI_REGEX.test(normalizedDoi)) {
    return `https://doi.org/${encodeURI(normalizedDoi)}`;
  }
  return '';
}

function toInitial(part: string): string {
  const cleaned = part.replace(/[^a-zA-ZÀ-ÿ0-9-]/g, '');
  if (!cleaned) return '';
  return `${cleaned.charAt(0).toUpperCase()}.`;
}

/**
 * Mengubah nama penulis menjadi format APA 7: "NamaBelakang, I. M."
 * Jika sudah berbentuk "Belakang, I." atau hanya 1 kata (mis. nama tunggal/instansi), dipertahankan rapi.
 */
export function formatAuthorApa7(rawName: string): string {
  const trimmed = rawName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  if (trimmed.includes(',')) {
    const [lastRaw, ...restParts] = trimmed.split(',');
    const last = lastRaw.trim();
    const rest = restParts.join(' ').trim();
    if (!rest) return last;
    const initials = rest
      .split(/\s+/)
      .map((token) => (token.endsWith('.') && token.length <= 3 ? token.toUpperCase() : toInitial(token)))
      .filter(Boolean)
      .join(' ');
    return initials ? `${last}, ${initials}` : last;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) {
    return tokens[0];
  }

  const last = tokens[tokens.length - 1];
  const given = tokens.slice(0, -1);
  const initials = given.map(toInitial).filter(Boolean).join(' ');
  return initials ? `${last}, ${initials}` : last;
}

export function formatAuthorListApa7(penulis: string[]): string {
  const formatted = penulis.map(formatAuthorApa7).filter(Boolean);
  if (formatted.length === 0) return '';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  if (formatted.length <= 20) {
    return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
  }
  return `${formatted.slice(0, 19).join(', ')}, ... ${formatted[formatted.length - 1]}`;
}

function ensureTrailingPeriod(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

/**
 * Menghasilkan teks sitasi APA edisi ke-7 untuk jurnal, buku, web, dan lainnya.
 */
export function formatSitasiAPA7(
  ref: Pick<
    ReferensiRecord,
    'judul' | 'penulis' | 'tahun' | 'jenis' | 'namaSumber' | 'volumeInfo' | 'tautan' | 'doi'
  >
): string {
  const judul = ref.judul.trim() || 'Tanpa judul';
  const tahun = ref.tahun.trim() || 'n.d.';
  const namaSumber = ref.namaSumber.trim();
  const volumeInfo = ref.volumeInfo.trim();
  const authorsStr = formatAuthorListApa7(ref.penulis);

  const normalizedDoi = normalizeDoi(ref.doi);
  const doiUrl = normalizedDoi && DOI_REGEX.test(normalizedDoi) ? `https://doi.org/${normalizedDoi}` : '';
  const safeTautan = sanitizeExternalUrl(ref.tautan) || ref.tautan.trim();
  const locator = doiUrl || safeTautan;

  const parts: string[] = [];

  if (authorsStr) {
    parts.push(ensureTrailingPeriod(authorsStr));
    parts.push(`(${tahun}).`);
    parts.push(ensureTrailingPeriod(judul));
  } else {
    parts.push(ensureTrailingPeriod(judul));
    parts.push(`(${tahun}).`);
  }

  if (ref.jenis === 'jurnal') {
    if (namaSumber && volumeInfo) {
      parts.push(`${namaSumber}, ${ensureTrailingPeriod(volumeInfo)}`);
    } else if (namaSumber) {
      parts.push(ensureTrailingPeriod(namaSumber));
    } else if (volumeInfo) {
      parts.push(ensureTrailingPeriod(volumeInfo));
    }
  } else if (ref.jenis === 'buku') {
    if (namaSumber) {
      parts.push(ensureTrailingPeriod(namaSumber));
    }
  } else if (ref.jenis === 'web') {
    if (namaSumber && namaSumber.toLowerCase() !== authorsStr.toLowerCase()) {
      parts.push(ensureTrailingPeriod(namaSumber));
    }
  } else {
    if (namaSumber && volumeInfo) {
      parts.push(`${namaSumber}, ${ensureTrailingPeriod(volumeInfo)}`);
    } else if (namaSumber) {
      parts.push(ensureTrailingPeriod(namaSumber));
    }
  }

  if (locator) {
    parts.push(locator);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function kumpulkanTagUnik(list: Pick<ReferensiRecord, 'tag'>[]): string[] {
  const set = new Set<string>();
  for (const item of list) {
    for (const tag of item.tag) {
      const clean = tag.trim();
      if (clean) set.add(clean);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
}

export function filterReferensi<
  T extends Pick<
    ReferensiRecord,
    'judul' | 'penulis' | 'tahun' | 'jenis' | 'namaSumber' | 'catatan' | 'tag' | 'doi' | 'statusBaca'
  >
>(
  list: T[],
  params: {
    query: string;
    tag: string;
    statusBaca: 'ALL' | StatusBacaReferensi;
    jenis: 'ALL' | JenisReferensi;
  }
): T[] {
  const q = params.query.trim().toLowerCase();
  const tagFilter = params.tag.trim().toLowerCase();

  return list.filter((item) => {
    if (params.statusBaca !== 'ALL' && item.statusBaca !== params.statusBaca) {
      return false;
    }
    if (params.jenis !== 'ALL' && item.jenis !== params.jenis) {
      return false;
    }
    if (tagFilter && tagFilter !== 'all') {
      const hasTag = item.tag.some((t) => t.trim().toLowerCase() === tagFilter);
      if (!hasTag) return false;
    }
    if (!q) return true;

    return (
      item.judul.toLowerCase().includes(q) ||
      item.tahun.toLowerCase().includes(q) ||
      item.namaSumber.toLowerCase().includes(q) ||
      item.catatan.toLowerCase().includes(q) ||
      item.doi.toLowerCase().includes(q) ||
      item.penulis.some((p) => p.toLowerCase().includes(q)) ||
      item.tag.some((t) => t.toLowerCase().includes(q))
    );
  });
}
