import express from 'express';
import Tiktok from '@tobyg74/tiktok-api-dl';

const router = express.Router();
const TIKTOK_COOKIE = "";

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
        const result = await Tiktok.Search(query.trim(), {
            type: "video",
            page: 1,
            cookie: TIKTOK_COOKIE
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
