import express from 'express';
import path from 'node:path';
import apiRoutes from './routes/api.ts';
import { PATHS } from './config/paths.ts';
import { errorHandler } from './middleware/error-handlers.ts';
import { startMonitor } from './services/monitor.ts';

const PORT = process.env.PORT || 3000;
const app = express();

app.set('etag', false);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PATHS.UI_DIST));
app.use('/api', apiRoutes);
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found', path: req.originalUrl });
});
app.all(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    const indexPath = path.resolve(PATHS.UI_DIST, 'index.html');

    res.sendFile(indexPath, (err) => {
        if (res.headersSent) {
            return;
        }

        if (err) {
            console.error("FS Error:", err);

            return res.status(404).send(`<h1>UI not built</h1><p>Looking in: ${indexPath}</p><p>Please run "npm run build:ui"</p>`);
        }
    });
});
app.use(errorHandler);
app.listen(PORT, async () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);

    void startMonitor();
});