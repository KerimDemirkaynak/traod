const fs = require('fs');
const path = require('path');

const DATA_URL = 'https://github.com/manami-project/anime-offline-database/releases/latest/download/anime-offline-database-minified.json';

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
        .replace(/-+$/, '') || 'anime';
}

async function buildSite() {
    console.log("📥 Anime veritabanı indiriliyor...");
    
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);

    const json = await response.json();
    const allAnimes = json.data;

    console.log(`✅ ${allAnimes.length} anime bulundu. Zenginleştirilmiş OLED sürüm işleniyor...`);

    const topAnimes = allAnimes
        .filter(a => a.score && a.score.arithmeticMean)
        .sort((a, b) => b.score.arithmeticMean - a.score.arithmeticMean)
        .slice(0, 1500); // Kapsamı biraz daha genişlettik

    const searchIndex = topAnimes.map(anime => ({
        title: anime.title,
        slug: slugify(anime.title),
        pic: anime.thumbnail || anime.picture,
        score: anime.score.arithmeticMean.toFixed(1),
        episodes: anime.episodes,
        type: anime.type
    }));
    fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex));

    const indexHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="referrer" content="no-referrer">
        <title>Anime Kayıt - Modern Veritabanı</title>
        <style>
            :root { 
                --bg: #000000; 
                --card: #0a0a0a; 
                --card-hover: #141414;
                --text: #ededed; 
                --text-muted: #888888;
                --neon-cyan: #00ffcc; 
                --neon-pink: #ff3366;
                --border: #222222;
            }
            body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; margin: 0; min-height: 100vh; }
            .header { text-align: center; margin-bottom: 50px; }
            h1 { font-size: 2.8rem; letter-spacing: 2px; margin: 0; }
            h1 span { color: var(--neon-cyan); text-shadow: 0 0 15px rgba(0,255,204,0.4); }
            p.subtitle { color: var(--text-muted); font-size: 1.1rem; }
            .search-container { max-width: 650px; margin: 0 auto 40px; position: relative; }
            input { width: 100%; box-sizing: border-box; padding: 18px 25px; background: var(--card); border: 1px solid var(--border); color: white; border-radius: 12px; font-size: 1.1rem; outline: none; transition: all 0.3s; }
            input:focus { border-color: var(--neon-cyan); box-shadow: 0 0 20px rgba(0,255,204,0.15); }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 25px; max-width: 1300px; margin: auto; }
            .card { background: var(--card); border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; border: 1px solid var(--border); transition: all 0.3s ease; display: flex; flex-direction: column; }
            .card:hover { transform: translateY(-8px); border-color: var(--neon-cyan); box-shadow: 0 10px 20px rgba(0,0,0,0.8); background: var(--card-hover); }
            .card img { width: 100%; height: 280px; object-fit: cover; border-bottom: 1px solid var(--border); }
            .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
            .card h3 { font-size: 1.1rem; margin: 0 0 8px; line-height: 1.3; }
            .badge { display: inline-block; background: rgba(0,255,204,0.1); color: var(--neon-cyan); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px; border: 1px solid rgba(0,255,204,0.2); }
            .stats { color: var(--text-muted); font-size: 0.9rem; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Anime<span>.Kayıt</span></h1>
            <p class="subtitle">OLED Uyumlu Şimşek Hızında Veritabanı</p>
        </div>
        
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Anime ara (Örn: Death Note, Naruto)..." onkeyup="filterAnimes()">
        </div>

        <div class="grid" id="grid">
            ${topAnimes.slice(0, 36).map(anime => `
                <a href="anime/${slugify(anime.title)}.html" class="card">
                    <img src="${anime.picture || anime.thumbnail || ''}" alt="${anime.title}" loading="lazy">
                    <div class="card-body">
                        <div>
                            <span class="badge">${anime.type || 'TV'}</span>
                            <h3>${anime.title}</h3>
                        </div>
                        <div class="stats">
                            <span>⭐ ${anime.score.arithmeticMean.toFixed(1)}</span>
                            <span>${anime.episodes || '?'} Bölüm</span>
                        </div>
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
                if(query.length === 1) return; 
                
                const filtered = query.length === 0 
                    ? allAnimes.slice(0, 36) 
                    : allAnimes.filter(a => a.title.toLowerCase().includes(query)).slice(0, 36);
                    
                grid.innerHTML = filtered.map(a => \`
                    <a href="anime/\${a.slug}.html" class="card">
                        <img src="\${a.pic}" alt="\${a.title}" loading="lazy">
                        <div class="card-body">
                            <div>
                                <span class="badge">\${a.type || 'Bilinmiyor'}</span>
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

    console.log("📄 Anime detay sayfaları zenginleştiriliyor...");
    topAnimes.forEach(anime => {
        const slug = slugify(anime.title);
        const season = anime.animeSeason ? `${anime.animeSeason.season} ${anime.animeSeason.year}` : 'Bilinmiyor';
        const durationMin = anime.duration?.value ? Math.floor(anime.duration.value / 60) + ' dk' : 'Bilinmiyor';
        
        const detailHtml = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="referrer" content="no-referrer">
            <title>${anime.title} - Detaylar ve Kaynaklar</title>
            <style>
                :root { 
                    --bg: #000000; 
                    --card: #0a0a0a; 
                    --text: #ededed; 
                    --text-muted: #888888;
                    --neon-cyan: #00ffcc; 
                    --neon-pink: #ff3366;
                    --border: #222222;
                }
                body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; max-width: 1100px; margin: auto; line-height: 1.6; }
                a { color: var(--neon-cyan); text-decoration: none; transition: 0.2s; }
                a:hover { color: #fff; text-shadow: 0 0 10px var(--neon-cyan); }
                .nav-link { display: inline-flex; align-items: center; margin-bottom: 30px; font-size: 1.1rem; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); }
                
                .hero { display: flex; gap: 40px; flex-wrap: wrap; margin-bottom: 50px; }
                .poster { width: 100%; max-width: 320px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.8); object-fit: cover; }
                .details { flex: 1; min-width: 300px; }
                
                h1 { color: var(--neon-cyan); margin: 0 0 10px 0; font-size: 2.8rem; line-height: 1.1; }
                .synonyms { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 25px; display: block; }
                
                .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin: 30px 0; }
                .info-card { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border); }
                .info-card span { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .info-card strong { font-size: 1.1rem; color: #fff; }
                
                h3 { color: var(--neon-cyan); border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-top: 40px; font-size: 1.4rem; }
                
                .tags-container { display: flex; flex-wrap: wrap; gap: 10px; }
                .tag { background: #111; padding: 8px 16px; border-radius: 20px; border: 1px solid #333; font-size: 0.95rem; }
                
                .source-links { display: flex; gap: 12px; flex-wrap: wrap; }
                .source-btn { background: transparent; border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 10px 20px; border-radius: 8px; font-weight: bold; }
                .source-btn:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 15px rgba(0,255,204,0.4); }
                
                .related-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
                .related-list li a { display: block; background: var(--card); padding: 12px 15px; border-radius: 8px; border: 1px solid var(--border); }
            </style>
        </head>
        <body>
            <a href="../index.html" class="nav-link">← Ana Sayfaya Dön</a>
            
            <div class="hero">
                <img src="${anime.picture || anime.thumbnail || ''}" alt="${anime.title} Afişi" class="poster">
                <div class="details">
                    <h1>${anime.title}</h1>
                    <span class="synonyms">${anime.synonyms ? anime.synonyms.slice(0, 4).join(' • ') : ''}</span>
                    
                    <div class="info-grid">
                        <div class="info-card"><span>Puan</span><strong>⭐ ${anime.score.arithmeticMean.toFixed(2)}</strong></div>
                        <div class="info-card"><span>Format</span><strong>${anime.type || 'Bilinmiyor'}</strong></div>
                        <div class="info-card"><span>Bölüm</span><strong>${anime.episodes || '?'}</strong></div>
                        <div class="info-card"><span>Bölüm Süresi</span><strong>${durationMin}</strong></div>
                        <div class="info-card"><span>Çıkış</span><strong>${season}</strong></div>
                        <div class="info-card"><span>Durum</span><strong>${anime.status || 'Bilinmiyor'}</strong></div>
                    </div>
                    
                    <h3>Yapım Bilgileri</h3>
                    <p><strong>Stüdyo:</strong> ${anime.studios?.length > 0 ? anime.studios.join(', ') : 'Belirtilmemiş'}</p>
                    <p><strong>Yapımcılar:</strong> ${anime.producers?.length > 0 ? anime.producers.join(', ') : 'Belirtilmemiş'}</p>
                    
                    <h3>Türler ve Etiketler</h3>
                    <div class="tags-container">
                        ${anime.tags ? anime.tags.slice(0, 15).map(t => `<span class="tag">${t}</span>`).join('') : '<span class="tag">Belirtilmemiş</span>'}
                    </div>

                    <h3>Dış Kaynaklar</h3>
                    <div class="source-links">
                        ${anime.sources ? anime.sources.map(src => {
                            const domain = new URL(src).hostname.replace('www.', '').split('.')[0].toUpperCase();
                            return `<a href="${src}" target="_blank" class="source-btn">${domain}</a>`;
                        }).join('') : '<p>Kaynak bulunamadı.</p>'}
                    </div>
                </div>
            </div>
        </body>
        </html>`;
        
        fs.writeFileSync(path.join(ANIME_DIR, `${slug}.html`), detailHtml);
    });

    console.log("🚀 Yapılandırma tamamlandı! Yeni OLED tasarım yayına hazır.");
}

buildSite().catch(err => {
    console.error("❌ Hata oluştu:", err);
    process.exit(1);
});
