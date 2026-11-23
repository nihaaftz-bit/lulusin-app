/**
 * Helper pemformatan tanggal ISO ke tampilan bahasa Indonesia
 * sesuai zona waktu perangkat pengguna (WIB / WITA / WIT).
 */

export function formatTanggalIndonesia(isoDate: string): string {
  if (!isoDate) return '';
  const dateOnlyMatch = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(isoDate);
  const parsed = dateOnlyMatch ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatTanggalSingkat(isoDate: string): string {
  if (!isoDate) return '';
  const dateOnlyMatch = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(isoDate);
  const parsed = dateOnlyMatch ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatWaktuIndonesia(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(parsed);
}

export function toLocalDateTimeInputValue(isoTimestamp?: string): string {
  const date = isoTimestamp ? new Date(isoTimestamp) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function localDateTimeInputToIso(localValue: string): string {
  if (!localValue) return '';
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function getLocalIsoDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
