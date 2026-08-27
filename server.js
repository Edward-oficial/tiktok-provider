import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import searchRouter from './routes/search.js';
import downloadRouter from './routes/download.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/search', searchRouter);
app.use('/api/download', downloadRouter);

app.get('/api', (req, res) => {
    res.json({
        status: true,
        creator: "Edward",
        endpoints: ["/api/search?query=", "/api/download?url="]
    });
});

function mantenerProcesoVivo() {
    const url = process.env.RENDER_EXTERNAL_URL;
    if (!url) return;
    setInterval(() => {
        fetch(url).catch(() => {});
    }, 1000 * 60 * 10);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proveedor corriendo en puerto ${PORT}`);
    mantenerProcesoVivo();
});
