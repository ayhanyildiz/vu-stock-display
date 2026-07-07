import { Router } from 'express';

import { syncState } from '../services/storage.ts';

import { generateDialImage } from '../services/image-service.ts';
import { loadAppState } from '../services/state.ts';
import { prepareForRunTime } from '../services/init-service.ts';
import { updateDialHardware } from '../services/dial-service.ts';
import type { AppConfig } from '@shared/models';
import { fetchStockQuoteFinnhub } from '../services/stock-quote.finnhub.ts';

const router = Router();

router.get('/config', async (req, res, next) => {
    try {
        res.set('Cache-Control', 'no-store');
        const config = await loadAppState();

        res.json(config);
    } catch (e) {
        next(e);
    }
});

router.post('/config', async (req, res, next) => {
    try {
        const { dials, ...safePatch } = req.body as Partial<AppConfig>;

        await prepareForRunTime(safePatch);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

router.get('/preview/:ticker', async (req, res) => {
    const config = await loadAppState();

    const quote = await fetchStockQuoteFinnhub(req.params.ticker, config);
    const imageBuffer = await generateDialImage(quote, config.logoDevToken);

    res.set('Content-Type', 'image/png').send(imageBuffer);
});

router.post('/refresh-dial', async (req, res) => {
    const { uid, ticker } = req.body ?? {};
    if (!uid || !ticker) {
        return res.status(400).json({ error: 'uid and ticker required' });
    }

    try {
        const current = await loadAppState();

        const nextDials = {
            ...(current.dials ?? {}),
            [uid]: { ticker },
        };

        await syncState(current, { dials: nextDials });

        const config = await loadAppState();
        const dialNumber = Object.keys(config.dials!).indexOf(uid) + 1;

        await updateDialHardware(config, uid, dialNumber ,true);

        return res.json({ success: true });
    } catch (e: any) {
        return res.status(400).json({ error: e?.message ?? 'Invalid stock data' });
    }
});



export default router;