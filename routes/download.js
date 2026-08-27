import express from 'express';
import Tiktok from '@tobyg74/tiktok-api-dl';

const router = express.Router();

router.get('/', async (req, res) => {
    const url = req.query.url;

    if (!url || url.trim().length === 0) {
        return res.status(400).json({
            status: false,
            creator: "Edward",
            error: "El parámetro url es requerido"
        });
    }

    const versions = ["v1", "v3", "v2"];
    let lastError = "No se pudo descargar el video";

    for (const version of versions) {
        try {
            const result = await Tiktok.Downloader(url.trim(), { version });

            if (result.status === "success" && result.result) {
                return res.json({
                    status: true,
                    creator: "Edward",
                    version,
                    data: result.result,
                    timestamp: new Date().toISOString()
                });
            }

            lastError = result.message || lastError;
        } catch (error) {
            lastError = error.message || lastError;
        }
    }

    res.status(500).json({
        status: false,
        creator: "Edward",
        error: lastError
    });
});

export default router;
