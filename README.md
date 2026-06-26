# dorksHelper

OSINT dorking ve soruşturma aracı. Şahıs veya kurum profili oluşturarak ilgili platformlarda arama yapmayı kolaylaştırır.

## Özellikler

- Profil bazlı sorgu üretimi — elimdeki bilgiyle başla, her bulguda profili zenginleştir
- 70+ hazır dork şablonu: Google, sosyal medya, teknik platformlar, sızıntı siteleri, arşivler
- Kategori bazlı sorgu listesi — tıkla, sistem browser'da yeni sekme açar
- Bulgu işaretleme ve profile yeni bilgi ekleme
- Sorgu durum takibi: bekleyen / açıldı / bulgu var / boş
- Obsidian vault entegrasyonu (v0.3)

## Kurulum

```bash
npm install
npm run dev
```

## Yapı

```
src/main/        → Electron ana süreç
src/preload/     → Güvenli IPC köprüsü
src/renderer/    → Svelte UI
resources/templates/ → Dork şablon kütüphanesi (JSON)
```

## Geliştirme Aşamaları

- **v0.1** — Temel iskelet: profil, sorgular, sekme açma ✓
- **v0.2** — Bulgu sistemi ve oturum yönetimi
- **v0.3** — Obsidian vault entegrasyonu
- **v0.4** — Kurum profili ve gelişmiş şablonlar
- **v0.5** — Workspace / vaka yönetimi
