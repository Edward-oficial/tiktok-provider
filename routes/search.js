import express from 'express';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const router = express.Router();

const proxyAgent = new HttpsProxyAgent("http://qmefplrt:p6d27d6c5uku@31.59.20.176:6754");

const tikwm = axios.create({
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    },
    timeout: 10000,
    httpsAgent: proxyAgent,
    proxy: false,
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchOnce(query) {
    const response = await tikwm.post(
        "https://www.tikwm.com/api/feed/search",
        new URLSearchParams({ keywords: query, count: 10, cursor: 0, HD: 1 })
    );

    if (response.data?.code !== 0) {
        throw new Error(response.data?.msg || "La API devolvió un error");
    }

    const videos = response.data?.data?.videos;
    if (!videos || videos.length === 0) {
        throw new Error("No se encontraron videos.");
    }

    return videos.map(v => ({
        id: v.video_id,
        desc: v.title,
        author: v.author?.unique_id,
        nickname: v.author?.nickname,
        cover: v.cover,
        duration: v.duration,
        stats: {
            playCount: v.play_count,
            likeCount: v.digg_count,
            commentCount: v.comment_count
        }
    }));
}

async function search(query, retries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await searchOnce(query);
        } catch (error) {
            lastError = error;

            if (error.message === "No se encontraron videos.") {
                throw error;
            }

            if (attempt < retries) {
                await sleep(500 * (attempt + 1));
            }
        }
    }

    throw lastError;
}

router.get('/', async (req, res) => {
    const query = req.query.query;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({
            status: false,
            creator: "Edward",
            error: "El parámetro query es requerido"
        });
    }

    try {
        const data = await search(query.trim());

        res.json({
            status: true,
            creator: "Edward",
            total: data.length,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            creator: "Edward",
            error: error.message || "Internal Server Error"
        });
    }
});

export default router;
