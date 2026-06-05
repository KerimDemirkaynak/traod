const fs = require('fs');
const path = require('path');

const DATA_URL = 'https://github.com/manami-project/anime-offline-database/releases/latest/download/anime-offline-database-minified.json';

// GitHub Pages Canlı Sitenin Adresi (Sitemap İçin Kritik)
const BASE_URL = 'https://kerimdemirkaynak.github.io/traod'; 

const PUBLIC_DIR = path.join(__dirname, 'public');
const ANIME_DIR = path.join(PUBLIC_DIR, 'anime');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ANIME_DIR)) fs.mkdirSync(ANIME_DIR, { recursive: true });

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function buildSite() {
    console.log("📥 Anime veritabanı indiriliyor...");
    
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);

    const json = await response.json();
    const allAnimes = json.data;

    console.log(`✅ ${allAnimes.length} anime bulundu. Veriler filtreleniyor...`);

    const topAnimes = allAnimes
        .filter(a => a.score && a.score.arithmeticMean && a.sources && a.sources.length >= 6)
        .sort((a, b) => b.score.arithmeticMean - a.score.arithmeticMean)
        .slice(0, 2500);

    // URL çakışmalarını önlemek için Unique Slug
    topAnimes.forEach((anime, index) => {
        const baseSlug = slugify(anime.title) || 'anime';
        anime.uniqueSlug = `${baseSlug}-${index}`;
    });

    // 1. ARAMA İNDEKSİ
    const searchIndex = topAnimes.map(anime => {
        const year = anime.animeSeason?.year || '';
        const synonyms = anime.synonyms ? anime.synonyms.join(' ') : '';
        const studios = anime.studios ? anime.studios.join(' ') : '';
        const tags = anime.tags ? anime.tags.join(' ') : '';
        
        return {
            title: anime.title,
            slug: anime.uniqueSlug,
            pic: anime.picture || anime.thumbnail,
            score: anime.score.arithmeticMean.toFixed(1),
            episodes: anime.episodes,
            type: anime.type,
            year: year,
            searchStr: `${anime.title} ${synonyms} ${studios} ${tags} ${year}`.toLowerCase()
        };
    });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex));

    // 2. ANA SAYFA (index.html)
    const indexHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="referrer" content="no-referrer">
        
        <title>Anime Kayıt - Modern Veritabanı</title>
        <meta name="description" content="En iyi animeleri keşfedin, puanlarına göre sıralayın. Stüdyo, yıl ve tür filtreleri ile gelişmiş anime arama motoru.">
        <meta property="og:title" content="Anime Kayıt - Modern Veritabanı">
        <meta property="og:description" content="Şimşek hızında, OLED uyumlu gelişmiş anime veritabanı.">
        <meta property="og:type" content="website">
        
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎬</text></svg>">
        
        <style>
            :root { 
                --bg: #000000; --card: #0a0a0a; --card-hover: #141414;
                --text: #ededed; --text-muted: #888888;
                --neon-cyan: #00ffcc; --border: #222222;
            }
            body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; margin: 0; min-height: 100vh; }
            .header { text-align: center; margin-bottom: 40px; }
            h1 { font-size: 2.8rem; margin: 0; }
            h1 span { color: var(--neon-cyan); text-shadow: 0 0 15px rgba(0,255,204,0.4); }
            p.subtitle { color: var(--text-muted); font-size: 1.1rem; }
            
            .controls { max-width: 800px; margin: 0 auto 40px; display: flex; gap: 15px; flex-wrap: wrap; }
            input { flex: 1; min-width: 250px; padding: 16px 20px; background: var(--card); border: 1px solid var(--border); color: white; border-radius: 12px; font-size: 1.1rem; outline: none; }
            select { padding: 16px 20px; background: var(--card); border: 1px solid var(--border); color: white; border-radius: 12px; font-size: 1rem; outline: none; cursor: pointer; }
            input:focus, select:focus { border-color: var(--neon-cyan); box-shadow: 0 0 20px rgba(0,255,204,0.15); }
            
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 25px; max-width: 1300px; margin: auto; }
            .card { background: var(--card); border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid var(--border); transition: all 0.3s ease; display: flex; flex-direction: column; }
            .card:hover { transform: translateY(-8px); border-color: var(--neon-cyan); }
            
            .card img { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-bottom: 1px solid var(--border); background: #111; }
            
            .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
            .card h3 { font-size: 1.1rem; margin: 0 0 8px; line-height: 1.3; }
            .badge { display: inline-block; background: rgba(0,255,204,0.1); color: var(--neon-cyan); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px; border: 1px solid rgba(0,255,204,0.2); }
            .stats { color: var(--text-muted); font-size: 0.9rem; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Anime<span>.Kayıt</span></h1>
            <p class="subtitle">Stüdyo, Yıl, Tür veya Alternatif İsimlerle Arayın</p>
        </div>
        
        <div class="controls">
            <input type="text" id="searchInput" placeholder="Örn: Solo Leveling, Mappa, Vampire, 2024..." oninput="filterAnimes()">
            <select id="typeFilter" onchange="filterAnimes()">
                <option value="">Tüm Formatlar</option>
                <option value="TV">Sadece TV</option>
                <option value="MOVIE">Sadece Film</option>
                <option value="OVA">OVA / ONA</option>
            </select>
        </div>

        <div class="grid" id="grid"></div>

        <script>
            let allAnimes = [];
            fetch('./search-index.json').then(res => res.json()).then(data => {
                allAnimes = data;
                renderGrid(allAnimes.slice(0, 36));
            });

            function filterAnimes() {
                const queryText = document.getElementById('searchInput').value.toLowerCase().trim();
                const typeFilter = document.getElementById('typeFilter').value;
                const grid = document.getElementById('grid');
                
                const searchTerms = queryText.split(' ').filter(t => t.length > 0);

                let filtered = allAnimes.filter(a => {
                    const matchesText = searchTerms.every(term => a.searchStr.includes(term));
                    const matchesType = typeFilter === '' || 
                                        (typeFilter === 'OVA' ? (a.type === 'OVA' || a.type === 'ONA') : a.type === typeFilter);
                    return matchesText && matchesType;
                });
                
                renderGrid(filtered.slice(0, 36));
            }

            function renderGrid(data) {
                const grid = document.getElementById('grid');
                if(data.length === 0) {
                    grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#888;">Sonuç bulunamadı.</p>';
                    return;
                }
                grid.innerHTML = data.map(a => \`
                    <a href="anime/\${a.slug}.html" class="card">
                        <img src="\${a.pic}" alt="\${a.title}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x450/111111/00ffcc?text=Gorsel+Yok';">
                        <div class="card-body">
                            <div>
                                <span class="badge">\${a.type || 'Bilinmiyor'} \${a.year ? '- '+a.year : ''}</span>
                                <h3>\${a.title}</h3>
                            </div>
                            <div class="stats">
                                <span>⭐ \${a.score}</span>
                                <span>\${a.episodes || '?'} Bölüm</span>
                            </div>
                        </div>
                    </a>
                \`).join('');
            }
        </script>
    </body>
    </html>`;
    
    fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);

    // 3. DETAY SAYFALARI
    console.log("📄 Anime detay sayfaları üretiliyor...");
    topAnimes.forEach(anime => {
        const season = anime.animeSeason ? `${anime.animeSeason.season} ${anime.animeSeason.year}` : 'Bilinmiyor';
        const durationMin = anime.duration?.value ? Math.floor(anime.duration.value / 60) + ' dk' : 'Bilinmiyor';
        const safeDesc = `${anime.title} anime detayları, puanı, stüdyosu ve izleme bağlantıları.`;
        
        const detailHtml = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="referrer" content="no-referrer">
            
            <title>${anime.title} - Anime Detayları ve Puanı</title>
            <meta name="description" content="${safeDesc}">
            <meta property="og:title" content="${anime.title} - Anime Kayıt">
            <meta property="og:description" content="${safeDesc}">
            <meta property="og:image" content="${anime.picture || anime.thumbnail}">
            <meta property="og:type" content="video.tv_show">
            
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎬</text></svg>">
            
            <style>
                :root { --bg: #000000; --card: #0a0a0a; --text: #ededed; --text-muted: #888888; --neon-cyan: #00ffcc; --border: #222222; }
                body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 40px 20px; max-width: 1100px; margin: auto; line-height: 1.6; }
                a { color: var(--neon-cyan); text-decoration: none; }
                .nav-link { display: inline-flex; margin-bottom: 30px; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); }
                .hero { display: flex; gap: 40px; flex-wrap: wrap; margin-bottom: 50px; }
                .poster { width: 100%; max-width: 300px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.8); background: #111; }
                .details { flex: 1; min-width: 300px; }
                h1 { color: var(--neon-cyan); margin: 0 0 10px 0; font-size: 2.8rem; line-height: 1.1; }
                .synonyms { color: var(--text-muted); font-size: 1rem; margin-bottom: 25px; display: block; font-style: italic; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin: 30px 0; }
                .info-card { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border); }
                .info-card span { display: block; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
                .info-card strong { font-size: 1.1rem; color: #fff; }
                h3 { color: var(--neon-cyan); border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-top: 40px; }
                .tags-container { display: flex; flex-wrap: wrap; gap: 10px; }
                .tag { background: #111; padding: 8px 16px; border-radius: 20px; border: 1px solid #333; font-size: 0.95rem; }
                .source-links { display: flex; gap: 12px; flex-wrap: wrap; }
                .source-btn { border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 8px 16px; border-radius: 8px; font-weight: bold; }
            </style>
        </head>
        <body>
            <a href="../index.html" class="nav-link">← Ana Sayfaya Dön</a>
            <div class="hero">
                <img src="${anime.picture || anime.thumbnail || ''}" alt="${anime.title} Afişi" class="poster" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x450/111111/00ffcc?text=Gorsel+Yok';">
                <div class="details">
                    <h1>${anime.title}</h1>
                    <span class="synonyms">${anime.synonyms ? anime.synonyms.join(' • ') : ''}</span>
                    
                    <div class="info-grid">
                        <div class="info-card"><span>Puan</span><strong>⭐ ${anime.score.arithmeticMean.toFixed(2)}</strong></div>
                        <div class="info-card"><span>Format</span><strong>${anime.type || 'Bilinmiyor'}</strong></div>
                        <div class="info-card"><span>Bölüm</span><strong>${anime.episodes || '?'}</strong></div>
                        <div class="info-card"><span>Süre</span><strong>${durationMin}</strong></div>
                        <div class="info-card"><span>Çıkış</span><strong>${season}</strong></div>
                        <div class="info-card"><span>Durum</span><strong>${anime.status || 'Bilinmiyor'}</strong></div>
                    </div>
                    
                    <p><strong>Stüdyo:</strong> ${anime.studios?.length > 0 ? anime.studios.join(', ') : 'Belirtilmemiş'}</p>
                    
                    <h3>Türler ve Etiketler</h3>
                    <div class="tags-container">
                        ${anime.tags ? anime.tags.map(t => `<span class="tag">${t}</span>`).join('') : '<span class="tag">Belirtilmemiş</span>'}
                    </div>

                    <h3>Dış Kaynaklar</h3>
                    <div class="source-links">
                        ${anime.sources ? anime.sources.map(src => {
                            const domain = new URL(src).hostname.replace('www.', '').split('.')[0].toUpperCase();
                            return `<a href="${src}" target="_blank" class="source-btn">${domain}</a>`;
                        }).join('') : ''}
                    </div>
                </div>
            </div>
        </body>
        </html>`;
        
        fs.writeFileSync(path.join(ANIME_DIR, `${anime.uniqueSlug}.html`), detailHtml);
    });

    // 4. SİTE HARİTASI (SITEMAP.XML) VE ROBOTS.TXT
    console.log("🗺️ Site haritası ve robots.txt oluşturuluyor...");
    const today = new Date().toISOString().split('T')[0];

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>`;

    topAnimes.forEach(anime => {
        sitemapXml += `
    <url>
        <loc>${BASE_URL}/anime/${anime.uniqueSlug}.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    sitemapXml += `\n</urlset>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml);

    const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt);

    console.log("🚀 Yapılandırma tamamlandı! Full SEO uyumlu site yayına hazır.");
}

buildSite().catch(err => {
    console.error("❌ Hata oluştu:", err);
    process.exit(1);
});
