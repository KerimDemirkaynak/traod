# Anime.Kayıt 🎬⚡

**Anime.Kayıt**, geleneksel API kısıtlamalarını ve yavaş sayfa yüklemelerini ortadan kaldıran, tamamen statik (SSG) ve şimşek hızında çalışan modern bir anime veritabanı projesidir. 

[Manami Anime Offline Database](https://github.com/manami-project/anime-offline-database) kullanılarak beslenen bu proje, devasa JSON verilerini istemciye indirtmek yerine arka planda **GitHub Actions** ile işler. Sonuç: Sıfır sunucu maliyeti, API hız sınırlarına (rate limit) takılmayan, kusursuz SEO uyumlu ve OLED ekranlar için tasarlanmış karanlık temalı bir platform.

## ✨ Öne Çıkan Özellikler

* **Jamstack Mimarisi:** İstemci tarafında ağır veri çekme işlemleri (fetch) yerine, veriler derleme (build) aşamasında statik HTML sayfalarına dönüştürülür.
* **Tam Otomasyon:** GitHub Actions, her hafta otomatik olarak çalışır, Manami'nin en güncel 58 MB'lık veritabanını indirir, süzer ve sadece 2 MB'lık hafif bir arama indeksi ve binlerce statik detay sayfası üretip yayına alır.
* **Akıllı Arama Motoru:** Sadece anime adıyla değil; stüdyo, çıkış yılı, türler (tags) ve Japonca alternatif isimlerle anında arama yapabilen, istemci taraflı çok hızlı bir filtreleme sistemi.
* **OLED Dostu Minimalist Tasarım:** Gerçek siyah (`#000000`) arka plan, neon vurgular (`#00ffcc`) ve modern UI prensipleriyle göz yormayan bir arayüz.
* **Tam SEO Uyumluluğu:** Dinamik URL'ler (slug), her animeye özel otomatik üretilen Open Graph (OG) etiketleri, `sitemap.xml` ve `robots.txt` ile arama motorlarında maksimum görünürlük.
* **Bypass Koruması:** Anime-Planet ve benzeri dış kaynaklı yüksek çözünürlüklü kapak görsellerindeki (Hotlink/Cloudflare) engellemeleri aşan `no-referrer` ve yedek (fallback) resim mimarisi.

## 🛠️ Teknolojiler ve Altyapı

* **Veri Kaynağı:** [Anime Offline Database (AOD)](https://github.com/manami-project/anime-offline-database)
* **Derleme (Build):** Vanilla Node.js (`fs`, `path`) 
* **Otomasyon (CI/CD):** GitHub Actions
* **Hosting:** GitHub Pages (Custom Domain entegreli)
* **Tasarım:** Saf HTML/CSS (OLED & Neon konsept)
* **Geliştirme Yaklaşımı:** Vibe Coding 🤖🤝👨‍💻

## 🚀 Nasıl Çalışır?

Proje herhangi bir sunucu veya veritabanına ihtiyaç duymaz. Sistem şu adımlarla kendi kendini inşa eder:

1.  `.github/workflows/deploy.yml` tetiklenir (Haftalık veya manuel).
2.  Geçici bir Ubuntu sunucusunda `build.js` dosyası çalıştırılır.
3.  Manami veritabanı indirilir ve popülerliğe göre (en az 6 farklı kaynakta bulunanlar) filtrelenir.
4.  Tüm animeler için arama indeksi ve SEO uyumlu tekil HTML dosyaları `/public` klasörüne üretilir.
5.  Üretilen statik dosyalar `gh-pages` dalına (branch) gönderilir ve saniyeler içinde yayına alınır.

## ⚙️ Kurulum ve Geliştirme

Kendi kopyanızı oluşturmak ve geliştirmek isterseniz:

1.  Bu depoyu kendi GitHub hesabınıza **Fork**'layın.
2.  Deponuzun `Settings > Actions > General` bölümünden **Read and write permissions** ayarını açın.
3.  `Settings > Pages` altından kaynak olarak `gh-pages` dalını seçin.
4.  `Actions` sekmesinden **Siteyi Uret ve Yayinla** iş akışını manuel olarak tetikleyin.
5.  Özel alan adı (Custom Domain) kullanacaksanız `build.js` içindeki `BASE_URL` değişkenini ve `.github/workflows/deploy.yml` dosyasındaki `cname` alanını kendi alan adınıza göre güncelleyin.

## 📝 Lisans

Bu projenin kaynak kodları [MIT Lisansı](LICENSE) ile lisanslanmıştır. Kullanılan veritabanı [Open Data Commons Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/) altındadır.
