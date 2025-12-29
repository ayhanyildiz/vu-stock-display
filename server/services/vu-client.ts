import type { AppConfig, StockQuote } from '@shared/models';

export async function fetchActiveDials(config: AppConfig): Promise<string[]> {
    const { url, apiKey } = config.vuServer;

    if (!apiKey || !url) {
        return [];
    }

    try {
        const base = url.replace(/\/+$/, '');
        const response = await fetch(`${base}/api/v0/dial/list?key=${encodeURIComponent(apiKey)}`);

        if (response.status === 403) {
            console.warn('VU API key rejected (403)');
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const data = json?.data;

        if (!Array.isArray(data)) return [];

        return data
            .map((d: any) => d.uid ?? d.id ?? d)
            .filter((id): id is string => typeof id === 'string');

    } catch (e) {
        console.error('fetchActiveDials failed:', e);
        return [];
    }
}

export async function updateDialNeedle(config: AppConfig, uid: string, percentChange: number): Promise<void> {
    const { url, apiKey } = config.vuServer;
    const safeNeedle = Math.min(Math.max(50 + (percentChange * 5), 0), 100);

    const resp = await fetch(`${url}/api/v0/dial/${uid}/set?value=${Math.round(safeNeedle)}&key=${apiKey}`);
    if (!resp.ok) throw new Error(`Needle update failed: HTTP ${resp.status}`);
}

export async function updateDialBacklight(config: AppConfig, uid: string, percentChange: number): Promise<void> {
    const { url, apiKey } = config.vuServer;
    const intensity = 0.7;

    let r = 80 * intensity, g = 80 * intensity, b = 60 * intensity; // Neutral
    if (percentChange > 0.01) {
        r = 30 * intensity; g = 100 * intensity; b = 40 * intensity; // Green
    } else if (percentChange < -0.01) {
        r = 100 * intensity; g = 35 * intensity; b = 35 * intensity; // Red
    }

    await fetch(`${url}/api/v0/dial/${uid}/backlight?red=${Math.round(r)}&green=${Math.round(g)}&blue=${Math.round(b)}&key=${apiKey}`);
}

export async function updateDialImage(config: AppConfig, uid: string, imageBuffer: Buffer, ticker: string): Promise<void> {
    const { url, apiKey } = config.vuServer;

    const formData = new FormData();
    formData.append('imgfile', new Blob([new Uint8Array(imageBuffer)]), `${ticker}.png`);

    const response = await fetch(`${url}/api/v0/dial/${uid}/image/set?key=${apiKey}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error(`VU Server rejected image: ${response.status}`);
}

export async function updateDial(config: AppConfig, uid: string, quote: StockQuote, imageBuffer: Buffer): Promise<void> {
    await Promise.all([
        updateDialNeedle(config, uid, quote.percentChange),
        updateDialBacklight(config, uid, quote.percentChange),
    ]);

    await updateDialImage(config, uid, imageBuffer, quote.ticker);
}