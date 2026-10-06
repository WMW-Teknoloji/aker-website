// =========================================================
// AKER OSGB - Tohum verisi üreticisi
// =========================================================
// src/cms-data.ts içindeki varsayılan içeriği D1'e yüklenebilir
// SQL'e çevirir. Yalnızca tablo boşken eklenir (INSERT OR IGNORE),
// böylece tekrar çalıştırmak canlı içeriği ezmez.
//
// Kullanım: node tools/seed.ts > db/seed.sql
// =========================================================

import { DEFAULT_DATA } from '../src/cms-data.ts';

const q = (value: unknown): string => `'${String(value ?? '').replace(/'/g, "''")}'`;

const lines: string[] = [
  '-- Bu dosya `node tools/seed.ts` ile üretilir. Elle düzenlemeyin.',
  '-- Yalnızca eksik kayıtları ekler; mevcut içeriği değiştirmez.',
  '',
];

function section(table: string, rows: readonly object[], columns: string[]): void {
  lines.push(`-- ${table} (${rows.length} kayıt)`);
  rows.forEach((row, index) => {
    const kayit = row as Record<string, unknown>;
    const values = columns.map((col) => (col === 'sira' ? String(index) : q(kayit[col])));
    lines.push(`INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
  });
  lines.push('');
}

section('slides', DEFAULT_DATA.slides, ['id', 'sira', 'image', 'alt']);
section('clients', DEFAULT_DATA.clients, ['id', 'sira', 'image', 'alt']);
section('careers', DEFAULT_DATA.careers, ['id', 'sira', 'title', 'text', 'cardImage', 'image']);
section('documents', DEFAULT_DATA.documents, ['id', 'sira', 'title', 'image']);
section('news', DEFAULT_DATA.news, ['id', 'sira', 'title', 'text', 'image', 'link']);
section('team', DEFAULT_DATA.team, ['id', 'sira', 'name', 'role', 'photo']);
section('branches', DEFAULT_DATA.branches, ['id', 'sira', 'name', 'street', 'district', 'city', 'postalCode', 'maps']);

console.log(lines.join('\n'));
