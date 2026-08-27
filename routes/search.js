import express from 'express';
import axios from 'axios';
import Tiktok from '@tobyg74/tiktok-api-dl';

const router = express.Router();

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
        const cookie = await getGuestCookie();

        const result = await Tiktok.Search(query.trim(), {
            type: "video",
            page: 1,
            cookie
        });

        if (result.status !== "success" || !result.result || result.result.length === 0) {
            return res.status(404).json({
                status: false,
                creator: "Edward",
                error: result.message || "No se encontraron videos"
            });
        }

        res.json({
            status: true,
            creator: "Edward",
            total: result.result.length,
            data: result.result,
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
