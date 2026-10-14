// =========================================================
// AKER OSGB - Yönetim API'si
// =========================================================
//   GET    /api/admin/<koleksiyon>          kayıtları listeler
//   POST   /api/admin/<koleksiyon>          kayıt ekler
//   PUT    /api/admin/<koleksiyon>/<id>     kayıt günceller
//   DELETE /api/admin/<koleksiyon>/<id>     kayıt siler
//   POST   /api/admin/<koleksiyon>/sira     sıralamayı günceller
//   GET    /api/admin/applications          başvuruları listeler
//   DELETE /api/admin/applications/<id>     başvuru siler
//   POST   /api/admin/upload                görsel yükler (R2)
//   GET    /api/admin/metinler/<anahtar>    düz metin sayfasını okur (ör. kvkk)
//   PUT    /api/admin/metinler/<anahtar>    düz metin sayfasını kaydeder
//
// Bütün uçlar geçerli oturum çerezi ister.
// =========================================================

import { checkOrigin, json } from '../../_lib/http.ts';
import { isAuthenticated } from '../../_lib/auth.ts';
import {
  COLLECTIONS,
  SAYFA_METINLERI,
  bumpVersion,
  isCollection,
  isSayfaMetni,
  listItems,
  newId,
  sayfaMetniOku,
} from '../../_lib/content.ts';
import { isValidId, validateItem } from '../../_lib/validate.ts';
import { deleteObject, putImage } from '../../_lib/media.ts';
import type { Ctx, Env } from '../../_lib/env.ts';

const YAZMA_METOTLARI = new Set(['POST', 'PUT', 'DELETE']);

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env, params } = ctx;

  // Yazma isteklerinde CSRF koruması
  if (YAZMA_METOTLARI.has(request.method) && !checkOrigin(request)) {
    return json({ error: 'forbidden' }, 403);
  }

  if (!(await isAuthenticated(request, env))) {
    return json({ error: 'Oturum gerekli.' }, 401);
  }

  const route = params['route'];
  const parts = Array.isArray(route) ? route : route ? [route] : [];
  const [first, second] = parts;

  if (!first) return json({ error: 'Bilinmeyen uç.' }, 404);

  if (first === 'upload') {
    return request.method === 'POST' ? uploadImage(request, env) : json({ error: 'method' }, 405);
  }

  if (first === 'applications') {
    return applicationsRoute(request, env, second);
  }

  if (first === 'messages') {
    return messagesRoute(request, env, second);
  }

  if (first === 'subscribers') {
    return subscribersRoute(request, env, parts.slice(1).join('/'));
  }

  if (first === 'metinler') {
    return metinRoute(request, env, second);
  }

  if (first === 'cv') {
    if (request.method !== 'GET') return json({ error: 'method' }, 405);
    return serveCv(env, parts.slice(1).join('/'));
  }

  if (!isCollection(first)) return json({ error: 'Bilinmeyen koleksiyon.' }, 404);

  if (second === 'sira') {
    return request.method === 'POST' ? reorder(request, env, first) : json({ error: 'method' }, 405);
  }

  switch (request.method) {
    case 'GET':
      return json({ kayitlar: await listItems(env, first) });
    case 'POST':
      return createItem(request, env, first);
    case 'PUT':
      return updateItem(request, env, first, second);
    case 'DELETE':
      return deleteItem(env, first, second);
    default:
      return json({ error: 'method' }, 405);
  }
};

// ---------------------------------------------------------
// İçerik kayıtları
// ---------------------------------------------------------
async function createItem(request: Request, env: Env, name: keyof typeof COLLECTIONS): Promise<Response> {
  const spec = COLLECTIONS[name];
  const dogrulama = validateItem(spec, await readJson(request));
  if (!dogrulama.ok) return json({ error: dogrulama.hata }, 422);

  const values = dogrulama.degerler!;
  const id = newId(name);
  const columns = ['id', 'sira', ...spec.fields.map((f) => f.name)];
  const placeholders = columns.map(() => '?').join(', ');

  const sonSira = await env.DB.prepare(`SELECT COALESCE(MAX(sira), -1) + 1 AS sira FROM ${spec.table}`).first<{
    sira: number;
  }>();

  await env.DB.prepare(`INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${placeholders})`)
    .bind(id, sonSira?.sira ?? 0, ...spec.fields.map((f) => values[f.name] ?? ''))
    .run();

  await bumpVersion(env);
  return json({ ok: true, id });
}

async function updateItem(
  request: Request,
  env: Env,
  name: keyof typeof COLLECTIONS,
  id: string | undefined,
): Promise<Response> {
  if (!isValidId(id)) return json({ error: 'Geçersiz kimlik.' }, 400);

  const spec = COLLECTIONS[name];
  const dogrulama = validateItem(spec, await readJson(request));
  if (!dogrulama.ok) return json({ error: dogrulama.hata }, 422);

  const values = dogrulama.degerler!;
  const atamalar = spec.fields.map((f) => `${f.name} = ?`).join(', ');

  const sonuc = await env.DB.prepare(
    `UPDATE ${spec.table} SET ${atamalar}, guncellendi = datetime('now') WHERE id = ?`,
  )
    .bind(...spec.fields.map((f) => values[f.name] ?? ''), id)
    .run();

  if (!sonuc.meta.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);

  await bumpVersion(env);
  return json({ ok: true });
}

async function deleteItem(env: Env, name: keyof typeof COLLECTIONS, id: string | undefined): Promise<Response> {
  if (!isValidId(id)) return json({ error: 'Geçersiz kimlik.' }, 400);

  const sonuc = await env.DB.prepare(`DELETE FROM ${COLLECTIONS[name].table} WHERE id = ?`).bind(id).run();
  if (!sonuc.meta.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);

  await bumpVersion(env);
  return json({ ok: true });
}

/** Panelden gelen kimlik dizisine göre sıra numaralarını yeniden yazar. */
async function reorder(request: Request, env: Env, name: keyof typeof COLLECTIONS): Promise<Response> {
  const body = (await readJson(request)) as { sira?: unknown };
  const ids = Array.isArray(body.sira) ? body.sira : null;

  if (!ids || ids.length === 0 || !ids.every(isValidId)) {
    return json({ error: 'Geçersiz sıralama listesi.' }, 422);
  }

  const table = COLLECTIONS[name].table;
  await env.DB.batch(
    ids.map((id, index) => env.DB.prepare(`UPDATE ${table} SET sira = ? WHERE id = ?`).bind(index, id)),
  );

  await bumpVersion(env);
  return json({ ok: true });
}

// ---------------------------------------------------------
// Düz metin sayfaları
// ---------------------------------------------------------
async function metinRoute(request: Request, env: Env, anahtar: string | undefined): Promise<Response> {
  if (!isSayfaMetni(anahtar)) return json({ error: 'Bilinmeyen metin.' }, 404);
  const spec = SAYFA_METINLERI[anahtar]!;

  if (request.method === 'GET') {
    const kayit = await sayfaMetniOku(env, anahtar);
    return json({
      metin: kayit?.metin ?? spec.varsayilan,
      guncellendi: kayit?.guncellendi ?? null,
    });
  }

  if (request.method === 'PUT') {
    const body = (await readJson(request)) as { metin?: unknown } | null;
    const metin = typeof body?.metin === 'string' ? body.metin.replace(/\r\n?/g, '\n').trim() : '';

    if (metin === '') return json({ error: `"${spec.label}" boş bırakılamaz.` }, 422);
    if (metin.length > spec.max) {
      return json({ error: `"${spec.label}" en fazla ${spec.max.toLocaleString('tr-TR')} karakter olabilir.` }, 422);
    }

    await env.DB.prepare(
      `INSERT INTO page_texts (anahtar, metin, guncellendi) VALUES (?, ?, datetime('now'))
       ON CONFLICT (anahtar) DO UPDATE SET metin = excluded.metin, guncellendi = excluded.guncellendi`,
    )
      .bind(anahtar, metin)
      .run();

    await bumpVersion(env);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
}

// ---------------------------------------------------------
// Başvurular
// ---------------------------------------------------------
async function applicationsRoute(request: Request, env: Env, id: string | undefined): Promise<Response> {
  if (request.method === 'GET') {
    const sonuc = await env.DB.prepare(
      `SELECT id, olusturuldu, careerId, careerTitle, name, phone, email, message, cvFileName, cvFileType, cvKey
       FROM applications ORDER BY olusturuldu DESC LIMIT 500`,
    ).all();
    return json({ kayitlar: sonuc.results ?? [] });
  }

  if (request.method === 'DELETE') {
    if (!isValidId(id)) return json({ error: 'Geçersiz kimlik.' }, 400);

    const kayit = await env.DB.prepare('SELECT cvKey FROM applications WHERE id = ?')
      .bind(id)
      .first<{ cvKey: string }>();

    const sonuc = await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();
    if (!sonuc.meta.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);

    if (kayit?.cvKey) await deleteObject(env, kayit.cvKey);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
}

// ---------------------------------------------------------
// İletişim formu mesajları
// ---------------------------------------------------------
async function messagesRoute(request: Request, env: Env, id: string | undefined): Promise<Response> {
  if (request.method === 'GET') {
    const sonuc = await env.DB.prepare(
      `SELECT id, olusturuldu, name, phone, email, message, mail_gitti
       FROM messages ORDER BY olusturuldu DESC LIMIT 500`,
    ).all();
    return json({ kayitlar: sonuc.results ?? [] });
  }

  if (request.method === 'DELETE') {
    if (!isValidId(id)) return json({ error: 'Geçersiz kimlik.' }, 400);
    const sonuc = await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
    if (!sonuc.meta.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
}

// ---------------------------------------------------------
// Bülten aboneleri
// ---------------------------------------------------------
async function subscribersRoute(request: Request, env: Env, kalan: string): Promise<Response> {
  if (request.method === 'GET') {
    const sonuc = await env.DB.prepare(
      'SELECT email, olusturuldu FROM subscribers ORDER BY olusturuldu DESC LIMIT 5000',
    ).all();
    const kayitlar = (sonuc.results ?? []) as { email: string; olusturuldu: string }[];

    // .../subscribers/csv adresi listeyi dosya olarak indirir.
    if (kalan === 'csv') {
      const satirlar = ['E-Posta,Kayit Tarihi', ...kayitlar.map((k) => `${k.email},${k.olusturuldu}`)];
      return new Response(`﻿${satirlar.join('\r\n')}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="bulten-aboneleri.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    return json({ kayitlar });
  }

  if (request.method === 'DELETE') {
    const email = decodeURIComponent(kalan);
    if (!email) return json({ error: 'Geçersiz adres.' }, 400);
    const sonuc = await env.DB.prepare('DELETE FROM subscribers WHERE email = ?').bind(email).run();
    if (!sonuc.meta.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
}

/** Özgeçmiş dosyasını yalnızca oturum açmış yöneticiye verir. */
async function serveCv(env: Env, anahtar: string): Promise<Response> {
  if (!anahtar || anahtar.includes('..') || !anahtar.startsWith('ozgecmis/')) {
    return json({ error: 'Geçersiz dosya.' }, 400);
  }

  const nesne = await env.MEDIA.get(anahtar);
  if (!nesne) return json({ error: 'Dosya bulunamadı.' }, 404);

  return new Response(nesne.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
    },
  });
}

// ---------------------------------------------------------
// Görsel yükleme
// ---------------------------------------------------------
async function uploadImage(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Dosya okunamadı.' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Dosya bulunamadı.' }, 422);

  const sonuc = await putImage(env, file);
  if (!sonuc.ok) return json({ error: sonuc.hata }, 422);

  return json({ ok: true, yol: sonuc.yol });
}

// ---------------------------------------------------------
async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
