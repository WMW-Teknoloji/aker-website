// =========================================================
// AKER OSGB - Yönetim API istemcisi
// =========================================================
// Panelin sunucuyla konuştuğu tek yer. Oturum çerezi tarayıcı
// tarafından otomatik gönderilir; burada token saklanmaz.
// =========================================================

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function istek<T>(yol: string, secenekler: RequestInit = {}): Promise<T> {
  const yanit = await fetch(yol, {
    credentials: 'same-origin',
    ...secenekler,
  });

  let govde: unknown = null;
  try {
    govde = await yanit.json();
  } catch {
    govde = null;
  }

  if (!yanit.ok) {
    const mesaj =
      (govde as { error?: string } | null)?.error ??
      (yanit.status === 401 ? 'Oturum sona erdi.' : 'İstek başarısız oldu.');
    throw new ApiError(mesaj, yanit.status);
  }

  return govde as T;
}

function jsonIstek<T>(yol: string, method: string, govde: unknown): Promise<T> {
  return istek<T>(yol, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  });
}

export interface KayitListesi<T> {
  kayitlar: T[];
}

export const api = {
  oturumVarMi: (): Promise<{ oturum: boolean }> => istek('/api/auth/session'),

  girisYap: (password: string): Promise<{ ok: boolean }> =>
    jsonIstek('/api/auth/login', 'POST', { password }),

  cikisYap: (): Promise<{ ok: boolean }> => istek('/api/auth/session', { method: 'DELETE' }),

  listele: <T>(koleksiyon: string): Promise<KayitListesi<T>> => istek(`/api/admin/${koleksiyon}`),

  ekle: (koleksiyon: string, kayit: Record<string, string>): Promise<{ ok: boolean; id: string }> =>
    jsonIstek(`/api/admin/${koleksiyon}`, 'POST', kayit),

  guncelle: (koleksiyon: string, id: string, kayit: Record<string, string>): Promise<{ ok: boolean }> =>
    jsonIstek(`/api/admin/${koleksiyon}/${encodeURIComponent(id)}`, 'PUT', kayit),

  sil: (koleksiyon: string, id: string): Promise<{ ok: boolean }> =>
    istek(`/api/admin/${koleksiyon}/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  sirala: (koleksiyon: string, sira: string[]): Promise<{ ok: boolean }> =>
    jsonIstek(`/api/admin/${koleksiyon}/sira`, 'POST', { sira }),

  metinGetir: (anahtar: string): Promise<{ metin: string; guncellendi: string | null }> =>
    istek(`/api/admin/metinler/${encodeURIComponent(anahtar)}`),

  metinKaydet: (anahtar: string, metin: string): Promise<{ ok: boolean }> =>
    jsonIstek(`/api/admin/metinler/${encodeURIComponent(anahtar)}`, 'PUT', { metin }),

  gorselYukle: async (dosya: File): Promise<string> => {
    const form = new FormData();
    form.append('file', dosya);
    const sonuc = await istek<{ ok: boolean; yol: string }>('/api/admin/upload', {
      method: 'POST',
      body: form,
    });
    return sonuc.yol;
  },
};
