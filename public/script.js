const queryInput = document.getElementById('queryInput');
const urlInput = document.getElementById('urlInput');
const searchBtn = document.getElementById('searchBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');
const resultsCount = document.getElementById('resultsCount');
const downloadResult = document.getElementById('downloadResult');
const emptyState = document.getElementById('emptyState');
const dot = document.querySelector('.dot');
const statusText = document.getElementById('statusText');

function formatNumber(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
}

function hideAll() {
    resultsSection.classList.add('hidden');
    downloadResult.classList.add('hidden');
    emptyState.classList.add('hidden');
}

async function checkStatus() {
    try {
        const res = await fetch('/api');
        if (res.ok) {
            dot.classList.add('online');
            statusText.textContent = 'servicio activo';
        } else {
            throw new Error();
        }
    } catch {
        dot.classList.add('offline');
        statusText.textContent = 'servicio caído';
    }
}

async function doSearch() {
    const query = queryInput.value.trim();
    if (!query) return;

    hideAll();
    searchBtn.disabled = true;
    searchBtn.textContent = 'buscando...';
    resultsSection.classList.remove('hidden');
    resultsGrid.innerHTML = '<p class="error-msg" style="grid-column:1/-1">cargando...</p>';
    resultsCount.textContent = '';

    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const json = await res.json();

        if (!json.status) {
            resultsGrid.innerHTML = `<p class="error-msg" style="grid-column:1/-1">${json.error}</p>`;
            return;
        }

        resultsCount.textContent = `${json.total} encontrados`;
        resultsGrid.innerHTML = '';

        json.data.forEach(video => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-cover" style="background-image:url('${video.video?.cover || video.video?.originCover || ''}')">
                    <span class="card-duration">${video.video?.duration || 0}s</span>
                </div>
                <div class="card-body">
                    <p class="card-desc">${video.desc || 'sin descripción'}</p>
                    <p class="card-author">@${video.author?.uniqueId || video.author?.nickname || 'desconocido'}</p>
                    <div class="card-stats">
                        <span>▶ ${formatNumber(video.stats?.playCount)}</span>
                        <span>❤ ${formatNumber(video.stats?.diggCount)}</span>
                    </div>
                    <button class="card-dl">descargar</button>
                </div>
            `;
            card.querySelector('.card-dl').addEventListener('click', () => {
                urlInput.value = `https://www.tiktok.com/@${video.author?.uniqueId}/video/${video.id}`;
                doDownload();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            resultsGrid.appendChild(card);
        });
    } catch (err) {
        resultsGrid.innerHTML = `<p class="error-msg" style="grid-column:1/-1">error de conexión</p>`;
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'buscar';
    }
}

async function doDownload() {
    const url = urlInput.value.trim();
    if (!url) return;

    hideAll();
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'procesando...';
    downloadResult.classList.remove('hidden');
    downloadResult.innerHTML = '<p class="dl-title">DESCARGA // procesando...</p>';

    try {
        const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
        const json = await res.json();

        if (!json.status) {
            downloadResult.innerHTML = `<p class="dl-title">DESCARGA // error</p><p class="error-msg">${json.error}</p>`;
            return;
        }

        const r = json.data;
        const videoSrc = r.video?.playAddr?.[0] || r.video?.playAddr || r.videoHD || r.videoWatermark || r.direct || '';
        const cover = r.cover?.[0] || r.originCover?.[0] || '';

        downloadResult.innerHTML = `
            <p class="dl-title">DESCARGA // ${json.version}</p>
            <div class="dl-content">
                <img class="dl-video" src="${cover}" alt="cover">
                <div class="dl-meta">
                    <p>autor: @${r.author?.username || r.author?.nickname || 'desconocido'}</p>
                    <p>desc: ${(r.desc || '').slice(0, 80) || 'sin descripción'}</p>
                    <div class="dl-links">
                        ${videoSrc ? `<a href="${videoSrc}" target="_blank">ver / descargar video</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        downloadResult.innerHTML = `<p class="dl-title">DESCARGA // error</p><p class="error-msg">error de conexión</p>`;
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'descargar';
    }
}

searchBtn.addEventListener('click', doSearch);
downloadBtn.addEventListener('click', doDownload);
queryInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') doDownload(); });

checkStatus();
