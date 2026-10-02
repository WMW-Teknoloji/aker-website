// =========================================================
// AKER OSGB - Sunucuya yayınlama
// =========================================================
// Depodaki takip edilen dosyaları Hetzner sunucusuna kopyalar
// ve Node sürecini yeniden başlatır.
//
//   node tools/deploy.ts
//
// Sunucudaki `.env` ve `/srv/aker-veri` (veri tabanı + yüklenen
// dosyalar) bu işlemden etkilenmez; kopyalama yalnızca kodun
// üzerine yazar.
//
// SSH erişimi `~/.ssh/config` içindeki `vienyu` girdisini kullanır.
// =========================================================

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUNUCU = process.env['AKER_SSH'] ?? 'vienyu';
const HEDEF = '/srv/aker-website';
const SURE = 'aker-website';

function calistir(komut: string, args: string[], secenekler: { cwd?: string; girdi?: Buffer } = {}): string {
  return execFileSync(komut, args, {
    cwd: secenekler.cwd ?? KOK,
    input: secenekler.girdi,
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'utf8',
  });
}

function main(): void {
  const durum = calistir('git', ['status', '--porcelain']).trim();
  if (durum) {
    console.log('Uyarı: commit edilmemiş değişiklikler var, sunucuya bunlar da gidecek:');
    console.log(durum.split('\n').slice(0, 10).map((s) => `  ${s}`).join('\n'));
  }

  const gecici = mkdtempSync(path.join(tmpdir(), 'aker-deploy-'));
  const paket = path.join(gecici, 'aker.tgz');

  try {
    // Takip edilen dosyalar + henüz commit edilmemiş yeni dosyalar.
    const dosyalar = calistir('git', ['ls-files', '--cached', '--others', '--exclude-standard']);
    // --force-local: Windows'ta `C:\...` yolu uzak sunucu sanılmasın diye.
    calistir('tar', ['--force-local', '-czf', paket, '-T', '-'], { girdi: Buffer.from(dosyalar, 'utf8') });

    console.log(`kopyalanıyor → ${SUNUCU}:${HEDEF}`);
    calistir('scp', ['-q', paket, `${SUNUCU}:/tmp/aker-deploy.tgz`]);

    const cikti = calistir('ssh', [
      SUNUCU,
      [
        `tar xzf /tmp/aker-deploy.tgz -C ${HEDEF}`,
        'rm -f /tmp/aker-deploy.tgz',
        `pm2 restart ${SURE} --update-env >/dev/null`,
        'sleep 2',
        'curl -sS -o /dev/null -w "ana sayfa: %{http_code}\\n" http://127.0.0.1:4200/',
        'curl -sS -o /dev/null -w "yonetim  : %{http_code}\\n" http://127.0.0.1:4200/admin',
      ].join(' && '),
    ]);

    console.log(cikti.trim());
    console.log('yayınlandı');
  } finally {
    rmSync(gecici, { recursive: true, force: true });
  }
}

main();
