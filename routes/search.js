import express from 'express';
import axios from 'axios';
import Tiktok from '@tobyg74/tiktok-api-dl';

const router = express.Router();

const tikwm = axios.create({
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    },
    timeout: 8000,
});

let cachedCookie = "";
let cachedAt = 0;

async function getGuestCookie() {
    const now = Date.now();
    if (cachedCookie && now - cachedAt < 1000 * 60 * 30) {
        return cachedCookie;
    }

    const response = await axios.get("https://www.tiktok.com/", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        },
        timeout: 8000,
    });

    const setCookie = response.headers["set-cookie"] || [];
    const cookie = setCookie.map(c => c.split(";")[0]).join("; ");

    cachedCookie = cookie;
    cachedAt = now;
    return cookie;
}

async function searchDirect(query) {
    const cookie = await getGuestCookie();

    const result = await Tiktok.Search(query, {
        type: "video",
        page: 1,
        cookie
    });

    if (result.status !== "success" || !result.result || result.result.length === 0) {
        throw new Error(result.message || "sin resultados directos");
    }

    return result.result.map(v => ({
        id: v.id,
        desc: v.desc,
        author: v.author?.uniqueId,
        nickname: v.author?.nickname,
        cover: v.video?.cover,
        duration: v.video?.duration,
        stats: v.stats,
        source: "direct"
    }));
}

async function searchFallback(query) {
    const response = await tikwm.post(
        "https://www.tikwm.com/api/feed/search",
        new URLSearchParams({ keywords: query, count: 10, cursor: 0, HD: 1 })
    );

    if (response.data?.code !== 0) {
        throw new Error(response.data?.msg || "fallback también falló");
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
        },
        source: "fallback"
    }));
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
        let data;
        let usedFallback = false;

        try {
            data = await searchDirect(query.trim());
        } catch (directError) {
            data = await searchFallback(query.trim());
            usedFallback = true;
        }

        res.json({
            status: true,
            creator: "Edward",
            fallback: usedFallback,
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
