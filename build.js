const fs = require('fs');
const path = require('path');

// Doğrudan "Releases" kısmındaki en güncel dosyayı çeken bağlantı
const DATA_URL = 'https://github.com/manami-project/anime-offline-database/releases/latest/download/anime-offline-database-minified.json';

// Çıktı klasörü
const PUBLIC_DIR = path.join(__dirname, 'public');
const ANIME_DIR = path.join(PUBLIC_DIR, 'anime');

// Klasörleri oluştur
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ANIME_DIR)) fs.mkdirSync(ANIME_DIR, { recursive: true });

// URL için güvenli isim (slug) oluşturma fonksiyonu
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Boşlukları tireye çevir
        .replace(/[^\w\-]+/g, '')       // Alfanümerik olmayanları sil
        .replace(/\-\-+/g, '-')         // Tekrarlayan tireleri tek yap
        .replace(/^-+/, '')             // Baştaki tireyi sil
        .replace(/-+$/, '') || 'anime'; // Sondaki tireyi sil (Boşsa 'anime' yap)
}

async function buildSite() {
    console.log("📥 Anime veritabanı indiriliyor (Bu işlem birkaç saniye sürebilir)...");
    
    const response = await fetch(DATA_URL);
    
    // Hata kontrolü: Bağlantı kırılırsa net bir hata verip işlemi durdurur
    if (!response.ok) {
        throw new Error(`Veritabanı çekilemedi! HTTP Hatası: ${response.status}`);
    }

    const json = await response.json();
    const allAnimes = json.data;

    console.log(`✅ ${allAnimes.length} anime bulundu. Veriler işleniyor...`);

    // Sadece puanı olanları al ve en yüksek puanlı ilk 1000 animeyi seç
    const topAnimes = allAnimes
        .filter(a => a.score && a.score.arithmeticMean)
        .sort((a, b) => b.score.arithmeticMean - a.score.arithmeticMean)
        .slice(0, 1000);

    // 1. ARAMA İNDEKSİ OLUŞTUR (Ana sayfa için)
    const searchIndex = topAnimes.map(anime => ({
        title: anime.title,
        slug: slugify(anime.title),
        pic: anime.thumbnail || anime.picture,
        score: anime.score.arithmeticMean.toFixed(1),
        episodes: anime.episodes
    }));
    fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex));

    // 2. ANA SAYFAYI (index.html) OLUŞTUR
    const indexHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Anime Keşfet - En Popüler Animeler</title>
        <meta name="description" content="En popüler animeleri keşfedin, puanlarına göre sıralayın ve detaylarını inceleyin.">
        <style>
            :root { --bg: #000; --card: #111; --text: #ededed; --neon: #00ffcc; }
            body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            h1 span { color: var(--neon); }
            .search { display: flex; max-width: 600px; margin: 0 auto 30px; gap: 10px; }
            input { flex: 1; padding: 12px; background: var(--card); border: 1px solid #333; color: white; border-radius: 8px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; max-width: 1200px; margin: auto; }
            .card { background: var(--card); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid #222; transition: transform 0.2s; }
            .card:hover { transform: translateY(-5px); border-color: var(--neon); }
            .card img { width: 100%; height: 250px; object-fit: cover; }
            .card-body { padding: 12px; }
            .card h3 { font-size: 1rem; margin: 0 0 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Anime<span>.Kayıt</span></h1>
            <p>Statik ve Şimşek Hızında ⚡</p>
        </div>
        
        <div class="search">
            <input type="text" id="searchInput" placeholder="Anime ara..." onkeyup="filterAnimes()">
        </div>

        <div class="grid" id="grid">
            ${topAnimes.slice(0, 30).map(anime => `
                <a href="anime/${slugify(anime.title)}.html" class="card">
                    <img src="${anime.picture || ''}" alt="${anime.title}" loading="lazy">
                    <div class="card-body">
                        <h3>${anime.title}</h3>
                        <p style="color:#888; font-size:0.9rem;">⭐ ${anime.score.arithmeticMean.toFixed(1)} • ${anime.episodes || '?'} Bölüm</p>
                    </div>
                </a>
            `).join('')}
        </div>

        <script>
            let allAnimes = [];
            fetch('search-index.json').then(res => res.json()).then(data => allAnimes = data);

            function filterAnimes() {
                const query = document.getElementById('searchInput').value.toLowerCase();
                const grid = document.getElementById('grid');
                if(query.length < 2 && query.length > 0) return; 
                
                const filtered = query.length === 0 
                    ? allAnimes.slice(0, 30) 
                    : allAnimes.filter(a => a.title.toLowerCase().includes(query)).slice(0, 30);
                    
                grid.innerHTML = filtered.map(a => \`
                    <a href="anime/\${a.slug}.html" class="card">
                        <img src="\${a.pic}" alt="\${a.title}" loading="lazy">
                        <div class="card-body">
                            <h3>\${a.title}</h3>
                            <p style="color:#888; font-size:0.9rem;">⭐ \${a.score} • \${a.episodes || '?'} Bölüm</p>
                        </div>
                    </a>
                \`).join('');
            }
        </script>
    </body>
    </html>`;
    
    fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);

    // 3. HER ANİME İÇİN ÖZEL SEO HTML SAYFASI OLUŞTUR
    console.log("📄 Anime detay sayfaları üretiliyor...");
    topAnimes.forEach(anime => {
        const slug = slugify(anime.title);
        const tags = anime.tags ? anime.tags.slice(0, 5).join(', ') : '';
        const season = anime.animeSeason ? `${anime.animeSeason.season} ${anime.animeSeason.year}` : 'Bilinmiyor';
        
        const detailHtml = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${anime.title} Detayları, Puanı ve Yorumlar</title>
            <meta name="description" content="${anime.title} animesi ${anime.episodes || '?'} bölümden oluşmaktadır. Türleri: ${tags}. Puanı: ${anime.score.arithmeticMean.toFixed(1)}">
            <style>
                body { background: #000; color: #ededed; font-family: sans-serif; padding: 20px; max-width: 900px; margin: auto; }
                a { color: #00ffcc; text-decoration: none; }
                .container { display: flex; gap: 30px; margin-top: 40px; flex-wrap: wrap; }
                img { width: 100%; max-width: 300px; border-radius: 12px; border: 2px solid #333; object-fit: cover; }
                .details { flex: 1; min-width: 300px; }
                h1 { color: #00ffcc; margin-top: 0; }
                .tag { background: #111; padding: 5px 10px; border-radius: 5px; border: 1px solid #333; display: inline-block; margin: 0 5px 5px 0; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 20px 0; }
                .info-grid div { background: #111; padding: 10px; border-radius: 8px; border: 1px solid #222; }
            </style>
        </head>
        <body>
            <a href="../index.html">← Ana Sayfaya Dön</a>
            <div class="container">
                <img src="${anime.picture || 'https://via.placeholder.com/300x450?text=Gorsel+Yok'}" alt="${anime.title} Afişi">
                <div class="details">
                    <h1>${anime.title}</h1>
                    <p style="color: #888;">${anime.synonyms ? anime.synonyms.slice(0, 3).join(' • ') : ''}</p>
                    
                    <div class="info-grid">
                        <div><strong>Puan:</strong> ⭐ ${anime.score.arithmeticMean.toFixed(2)}</div>
                        <div><strong>Bölüm:</strong> ${anime.episodes || '?'}</div>
                        <div><strong>Çıkış:</strong> ${season}</div>
                        <div><strong>Durum:</strong> ${anime.status || 'Bilinmiyor'}</div>
                        <div><strong>Stüdyo:</strong> ${anime.studios ? anime.studios.join(', ') : 'Bilinmiyor'}</div>
                    </div>
                    
                    <h3 style="color: #00ffcc; margin-top: 30px;">Türler</h3>
                    <div>
                        ${anime.tags ? anime.tags.slice(0, 10).map(t => `<span class="tag">${t}</span>`).join('') : '<p>Belirtilmemiş</p>'}
                    </div>

                    <h3 style="color: #00ffcc; margin-top: 30px;">Dış Bağlantılar</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${anime.sources ? anime.sources.map(src => {
                            const domain = new URL(src).hostname.replace('www.', '');
                            return `<a href="${src}" target="_blank" style="border: 1px solid #00ffcc; padding: 5px 10px; border-radius: 5px; font-size: 0.9rem;">${domain}</a>`;
                        }).join('') : '<p>Bağlantı yok</p>'}
                    </div>
                </div>
            </div>
        </body>
        </html>`;
        
        fs.writeFileSync(path.join(ANIME_DIR, `${slug}.html`), detailHtml);
    });

    console.log("🚀 Yapılandırma tamamlandı! Tüm statik dosyalar 'public' klasörüne aktarıldı.");
}

buildSite().catch(err => {
    console.error("❌ Hata oluştu:", err);
    process.exit(1);
});
