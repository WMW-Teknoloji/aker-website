// =========================================================
// AKER OSGB - Sunucu tarafı doğrulama
// =========================================================
// Panelden gelen veri hiçbir zaman güvenilir kabul edilmez.
// Alan adları koleksiyon tanımından gelir; tanımsız alanlar
// sessizce atılır.
// =========================================================

import type { CollectionSpec } from './content.ts';

export interface ValidationResult {
  ok: boolean;
  hata?: string;
  degerler?: Record<string, string>;
}

/** Görsel yolu: yerel /img/... yolu veya https adresi olabilir. */
function isAllowedPath(value: string): boolean {
  if (value === '') return true;
  if (value.startsWith('/img/')) return !value.includes('..');
  return /^https:\/\/[^\s"'<>]+$/.test(value);
}

export function validateItem(spec: CollectionSpec, body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, hata: 'Geçersiz istek gövdesi.' };
  }

  const input = body as Record<string, unknown>;
  const degerler: Record<string, string> = {};

  for (const field of spec.fields) {
    const raw = input[field.name];
    const value = raw === undefined || raw === null ? '' : String(raw).trim();
    const ad = field.label ?? field.name;

    if (!field.optional && value === '') {
      return { ok: false, hata: `"${ad}" alanı boş bırakılamaz.` };
    }
    if (value.length > field.max) {
      return { ok: false, hata: `"${ad}" alanı en fazla ${field.max} karakter olabilir.` };
    }
    if (field.isPath && !isAllowedPath(value)) {
      return { ok: false, hata: `"${ad}" alanı geçerli bir görsel adresi değil.` };
    }
    if (field.isUrl && value !== '' && !/^https:\/\/[^\s"'<>]+$/.test(value)) {
      return { ok: false, hata: `"${ad}" alanı https:// ile başlayan bir bağlantı olmalı.` };
    }

    degerler[field.name] = value;
  }

  return { ok: true, degerler };
}

/** Kimlik biçimi: yalnızca harf, rakam ve tire. */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{1,64}$/i.test(value);
}
