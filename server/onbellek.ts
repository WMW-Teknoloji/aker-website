// =========================================================
// AKER OSGB - `caches.default` karşılığı
// =========================================================
// `functions/_middleware.ts` üretilen sayfayı Workers önbelleğine
// koyar ve içerik sürümü değişene kadar oradan servis eder.
// Kendi sunucumuzda bu global yok; burada süreç belleğinde
// küçük bir karşılığı kurulur.
//
// Önbellek anahtarı zaten içerik sürümünü taşıdığı için kayıt
// sonrası eski sayfa dönmez; yeniden başlatmada boşalması da
// sorun değildir.
// =========================================================

interface Kayit {
  status: number;
  headers: [string, string][];
  govde: Buffer;
}

export interface Onbellek {
  match: (istek: Request | string) => Promise<Response | undefined>;
  put: (istek: Request | string, yanit: Response) => Promise<void>;
  delete: (istek: Request | string) => Promise<boolean>;
}

/** En fazla kaç sayfa saklanır. Aşılınca en eski kayıt düşer. */
const SINIR = 200;
/** Bu boyutun üstündeki yanıtlar saklanmaz. */
const EN_BUYUK_GOVDE = 2 * 1024 * 1024;

function anahtar(istek: Request | string): string {
  return typeof istek === 'string' ? istek : istek.url;
}

export function onbellekKur(): Onbellek {
  const kutu = new Map<string, Kayit>();

  const depo: Onbellek = {
    async match(istek) {
      const kayit = kutu.get(anahtar(istek));
      if (!kayit) return undefined;
      return new Response(new Uint8Array(kayit.govde), { status: kayit.status, headers: kayit.headers });
    },

    async put(istek, yanit) {
      if (!yanit.body) return;
      const govde = Buffer.from(await yanit.arrayBuffer());
      if (govde.byteLength > EN_BUYUK_GOVDE) return;

      if (kutu.size >= SINIR) {
        const enEski = kutu.keys().next().value;
        if (enEski !== undefined) kutu.delete(enEski);
      }

      const headers: [string, string][] = [];
      yanit.headers.forEach((deger, ad) => {
        if (ad.toLowerCase() !== 'set-cookie') headers.push([ad, deger]);
      });

      kutu.set(anahtar(istek), { status: yanit.status, headers, govde });
    },

    async delete(istek) {
      return kutu.delete(anahtar(istek));
    },
  };

  // Functions kodu `caches.default` bekliyor.
  (globalThis as unknown as { caches: { default: Onbellek; open: (ad: string) => Promise<Onbellek> } }).caches = {
    default: depo,
    open: async () => depo,
  };

  return depo;
}
