# dorksHelper — Proje Raporu

## 1. Proje Nedir?

dorksHelper, OSINT (Open Source Intelligence) soruşturmalarında Google dork ve platform araması yapmayı organize eden masaüstü uygulamasıdır. Hedef, elimdeki kısıtlı bilgiyle başlayıp her bulguda profili zenginleştirerek iteratif bir soruşturma yürütebilmektir.

### Neden Bu Araç?

Mevcut OSINT araçları iki uç arasında kalır:
- **Otomatik araçlar** (SpiderFoot, theHarvester): Tüm bilgileri baştan ister, sonuçları kendin işleyemezsin.
- **Manuel yöntem**: Sekmeleri kendin açarsın, bulgular dağınık kalır, nerede bıraktığını kaybedersin.

dorksHelper ortada durur: **sorgular sana liste olarak gelir, tıklarsın, bulguları işaretlersin, profil zenginleşir, yeni sorgular aktif olur.** Obsidian vault'una da otomatik yazar.

---

## 2. Nasıl Çalışır?

### Temel Akış

```
1. Profil Oluştur     → İsim, email, kullanıcı adı... (boş alanlar olabilir)
        ↓
2. Sorgular Üretilir  → Elimdeki bilgilerle doldurulabilecek şablonlar aktif olur
        ↓
3. Sorguya Tıkla      → Sistem browser'ında yeni sekme açılır
        ↓
4. Bulgu İşaretle     → Kaynak URL, not, güven skoru girilir
        ↓
5. Profile Ekle       → Yeni email/username/telefon eklenirse yeni sorgular devreye girer
        ↓
2'ye dön              → İteratif döngü
```

### Sorgu Aktifliği Mantığı

Her dork şablonu hangi profil alanlarına ihtiyaç duyduğunu `requiredFields` ile tanımlar:

```json
{
  "label": "Email → Pastebin sızıntısı",
  "template": "\"{{email}}\" site:pastebin.com",
  "requiredFields": ["email"]
}
```

Profilde `emails` boşsa bu sorgu gri görünür. Email eklendiğinde otomatik aktif olur.

---

## 3. Mimari

### Teknoloji Yığını

| Katman       | Teknoloji       | Neden                                          |
|---|---|---|
| Masaüstü     | Electron        | Filesystem erişimi + native browser sekmesi açma |
| UI           | Svelte 4        | Az boilerplate, reactive store, okunabilir      |
| Build        | electron-vite   | Electron için optimize Vite                     |
| Depolama     | Düz JSON (fs)   | Şeffaf, harici kütüphane gerekmez               |
| Obsidian     | gray-matter     | YAML frontmatter üretimi (v0.3'te aktif)        |

### Klasör Yapısı

```
dorksHelper/
│
├── src/
│   ├── main/                     # Electron ana süreci (Node.js)
│   │   ├── index.js              # Pencere oluşturma, uygulama giriş noktası
│   │   ├── ipc.js                # Renderer ↔ Main köprüsü (tüm IPC handler'lar)
│   │   └── core/
│   │       ├── storage.js        # JSON okuma/yazma (profil, oturum, ayarlar)
│   │       └── dork-engine.js    # Şablondan sorgu üretimi
│   │
│   ├── preload/
│   │   └── index.js              # Güvenli API köprüsü (contextBridge)
│   │
│   └── renderer/                 # Svelte UI (tarayıcı ortamı)
│       ├── index.html
│       └── src/
│           ├── App.svelte        # Ana layout (sidebar + içerik)
│           ├── main.js           # Renderer giriş noktası
│           ├── stores/
│           │   ├── profile.js    # Profil listesi ve aktif profil
│           │   ├── session.js    # Sorgu durumları ve bulgular
│           │   └── settings.js   # Uygulama ayarları (vault yolu)
│           ├── components/
│           │   ├── Sidebar.svelte       # Profil listesi
│           │   ├── ProfileForm.svelte   # Profil oluşturma/düzenleme formu
│           │   ├── QueryList.svelte     # Kategori grupları + filtreler
│           │   ├── QueryItem.svelte     # Tek sorgu satırı
│           │   ├── FindingModal.svelte  # Bulgu kaydetme ekranı
│           │   └── SettingsModal.svelte # Obsidian vault ayarı
│           └── styles/
│               └── app.css             # Global dark tema
│
├── resources/
│   └── templates/                # Dork şablon kütüphanesi (JSON)
│       ├── google.json           # Google, Bing, Yandex, DuckDuckGo
│       ├── social-media.json     # 15 sosyal medya platformu
│       ├── technical.json        # GitHub, GitLab, Shodan, crt.sh
│       ├── leaks.json            # Pastebin, HIBP, sızıntı siteleri
│       ├── archive.json          # Wayback Machine, Google Cache
│       └── image-search.json     # Reverse image search
│
├── electron.vite.config.mjs
├── package.json
├── README.md
└── PROJECT.md                    # Bu dosya
```

---

## 4. Bileşenler

### 4.1 dork-engine.js

Tüm şablon JSON dosyalarını okur, profil değişkenlerini yerleştirerek URL üretir.

**İki URL üretim biçimi desteklenir:**

```js
// Biçim 1: baseUrl + sorgu (Google tarzı)
{ "baseUrl": "https://www.google.com/search?q=", "template": "\"{{name}}\"" }
// → https://www.google.com/search?q=%22Ahmet+Yilmaz%22

// Biçim 2: Tam URL şablonu (direkt profil sayfaları)
{ "urlTemplate": "https://www.instagram.com/{{username}}/" }
// → https://www.instagram.com/ahmet42/
```

**Desteklenen değişkenler:** `{{name}}`, `{{email}}`, `{{username}}`, `{{phone}}`, `{{domain}}`, `{{location}}`, `{{company}}`

### 4.2 storage.js

Tüm veriler `%APPDATA%/dorks-helper/data/` altında tutulur:

```
data/
├── profiles.json       # Tüm profiller (dizi)
├── settings.json       # Vault yolu ve tercihler
└── sessions/
    └── {profileId}.json  # Her profil için ayrı oturum dosyası
```

### 4.3 Svelte Stores

**profile.js**
- `profiles` — tüm profillerin reactive listesi
- `activeProfileId` — seçili profil ID'si
- `activeProfile` — derived: ID'ye göre profil nesnesi
- `profileActions` — load/add/update/delete metodları

**session.js**
- `queries` — aktif profil için üretilen sorgu listesi
- `queryStates` — her sorgunun durumu: `pending | opened | found | empty`
- `findings` — kaydedilen bulgular
- `queriesWithState` — derived: queries + queryStates birleşimi
- `stats` — derived: toplam/aktif/bulgu sayıları
- `sessionActions` — openQuery/markState/addFinding/refreshQueries

`activeProfile` değiştiğinde session store otomatik yenilenir.

### 4.4 Şablon Sistemi

Her şablon JSON nesnesi:

```json
{
  "id":            "github-email-search",
  "platform":      "github",
  "platformLabel": "GitHub",
  "category":      "technical",
  "categoryLabel": "Teknik",
  "priority":      "high",
  "label":         "Email commit araması",
  "description":   "GitHub commit geçmişinde email ara",
  "urlTemplate":   "https://github.com/search?q={{email}}&type=commits",
  "requiredFields": ["email"]
}
```

Yeni şablon eklemek için ilgili JSON dosyasına nesne eklenir — kod değişmez.

---

## 5. Veri Akışı

### Yeni Profil Oluşturma

```
ProfileForm.save()
  → profileActions.add(fields)
  → profiles store güncellenir
  → window.api.profiles.save() → IPC → storage.saveProfiles()
  → activeProfileId yeni profile set edilir
  → session.js store'daki activeProfile.subscribe() tetiklenir
  → window.api.queries.generate(profile) → IPC → dork-engine.generateQueries()
  → queries store güncellenir
  → UI sorgular listesini gösterir
```

### Sorgu Açma

```
QueryItem [Aç] butonuna tıkla
  → QueryList.handleOpen()
  → window.api.browser.open(url) → IPC → shell.openExternal(url)
  → sessionActions.openQuery(queryId)
  → queryStates[queryId] = 'opened'
  → session.js persist() → window.api.session.save() → storage.saveSession()
  → UI sorgunun ikonu ○ → ✓ değişir
  → [Boş] ve [Bulgu] butonları belirir
```

### Bulgu Kaydetme + Profile Bilgi Ekleme

```
FindingModal.save()
  → sessionActions.addFinding(finding, newProfileData)
  → findings listesine yeni bulgu eklenir
  → queryStates[queryId] = 'found'
  → Eğer newProfileData varsa:
      profileActions.update(id, newProfileData)
      → profiles store güncellenir + diske yazılır
      → dork-engine yeniden çalışır (yeni alanlarla yeni sorgular aktif olur)
  → session diske yazılır
  → UI sorgunun ikonu ✓ → ★ değişir
```

---

## 6. Kategoriler ve Platformlar

### Sorgu Kategorileri

| Kategori | Açıklama |
|---|---|
| Kimlik Tespiti | İsim, email, telefon, kullanıcı adı araması |
| Sosyal Medya | 15 platform (Twitter, Instagram, Facebook...) |
| İş ve Kariyer | LinkedIn, Glassdoor, iş ilanları |
| Belge ve Dosyalar | PDF, DOC, XLS sızıntıları |
| Kimlik Bilgisi Sızıntısı | Pastebin, HIBP, sızıntı siteleri |
| Teknik | GitHub, Shodan, crt.sh, GitLab |
| Görsel ve Medya | Google/Yandex Görseller, TinEye |
| Haber ve Basın | Google Haberler, haber siteleri |
| Arşiv ve Tarihsel | Wayback Machine, Google Cache |

### Kapsanan Platformlar (70+ şablon)

Google, Bing, Yandex, DuckDuckGo, X/Twitter, Instagram, Facebook, LinkedIn, TikTok, YouTube, Reddit, Telegram, Pinterest, Tumblr, Flickr, VKontakte, Mastodon, Medium, GitHub, GitLab, Shodan, crt.sh, Pastebin, HaveIBeenPwned, Wayback Machine, TinEye

---

## 7. Obsidian Entegrasyonu (v0.3)

Ayarlar'dan vault klasörü seçildiğinde her bulgu ve profil Obsidian'a yazılır.

### Planlanan Vault Yapısı

```
vault/OSINT/
├── Sahislar/
│   └── Ahmet_Yilmaz.md          ← profil notu (her güncellemede üzerine yazılır)
├── Kurumlar/
│   └── Acme_Ltd.md
├── Bulgular/
│   ├── Bulgu-001.md             ← her bulgu ayrı not (değişmez)
│   ├── Bulgu-002.md
│   └── _master.md               ← tüm bulgular tek dosyada (append)
└── Oturumlar/
    └── 2026-06-26_Ahmet.md      ← oturum özeti
```

Her notta `#dorks` etiketi zorunlu. Obsidian Dataview ile sorgulanabilir format.

---

## 8. Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18+
- npm

### Kurulum

```bash
git clone https://github.com/Gardantua/dorksHelper.git
cd dorksHelper
npm install
```

### Geliştirme

```bash
npm run dev
```

### Derleme (.exe)

```bash
npm run dist
```

---

## 9. Yeni Şablon Nasıl Eklenir?

`resources/templates/` altındaki ilgili JSON dosyasına yeni nesne ekle:

```json
{
  "id":            "benzersiz-bir-id",
  "platform":      "platform-kodu",
  "platformLabel": "Görüntülenen Platform Adı",
  "category":      "identity|social|career|documents|credentials|technical|media|news|archive",
  "categoryLabel": "Türkçe Kategori Adı",
  "priority":      "high|medium|low",
  "label":         "Kısa açıklama",
  "description":   "Uzun açıklama",

  // Google tarzı (baseUrl + sorgu):
  "template":      "\"{{name}}\" site:ornek.com",
  "baseUrl":       "https://www.google.com/search?q=",

  // veya direkt URL:
  "urlTemplate":   "https://platform.com/{{username}}",

  "requiredFields": ["name"]  // hangi alanlar doluysa bu sorgu aktif olur
}
```

Değişkenler: `{{name}}`, `{{email}}`, `{{username}}`, `{{phone}}`, `{{domain}}`, `{{location}}`, `{{company}}`

---

## 10. Geliştirme Yol Haritası

| Versiyon | Kapsam | Durum |
|---|---|---|
| v0.1 | Temel iskelet: profil, sorgular, sekme açma | ✅ Tamamlandı |
| v0.2 | Oturum yönetimi, profil silme, çoklu değer desteği | Planlandı |
| v0.3 | Obsidian vault entegrasyonu (gray-matter hazır) | Planlandı |
| v0.4 | Kurum profil tipi, şablon editörü, JSON import/export | Planlandı |
| v0.5 | Workspace/vaka yönetimi, username enumeration | Planlandı |
| v0.6 | Oturum raporu, .exe paketi | Planlandı |

---

## 11. Bilinen Eksikler (v0.1)

- Profil silme butonu henüz yok (store'da `delete` fonksiyonu var, UI'a bağlanmadı)
- Çoklu email/username için ayrı sorgular üretilmiyor (ilk değer kullanılıyor)
- Obsidian yazma henüz pasif (vault yolu kaydediliyor, yazma v0.3'te)
- Şablon editörü yok (JSON dosyasını elle düzenle)
