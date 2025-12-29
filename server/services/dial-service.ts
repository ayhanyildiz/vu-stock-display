import { setTimeout as sleep } from 'node:timers/promises';
import CRC32 from 'crc-32';

import type { AppConfig } from '@shared/models';
import { fetchStockQuote } from './stock-quote.ts';
import { generateDialImage } from './image-service.ts';
import { updateDial } from './vu-client.ts';
import { getDialRuntimeState, setDialRuntimeState } from './state.ts';

export async function updateDialHardware(
    state: AppConfig,
    uid: string,
    dialNumber?: number,
    force = false
): Promise<void> {
    const dialRuntime = getDialRuntimeState(uid);
    const ticker = state.dials?.[uid]?.ticker;

    if (!ticker) {
        console.log(`⏭️  [Dial ${dialNumber} ${uid}]: No ticker assigned.`);
        return;
    }

    const quote = await fetchStockQuote(ticker);

    if (!force && dialRuntime.lastPrice !== 0) {
        const deltaPct =
            Math.abs((quote.currentPrice - dialRuntime.lastPrice) / dialRuntime.lastPrice) * 100;

        if (deltaPct  < state.settings.thresholdPercent) {
            console.log(`⏭️  [${ticker} -> Dial ${dialNumber}]: Stable.`);
            return;
        }
    }

    const imageBuffer = await generateDialImage(quote, state.logoDevToken);
    const crc = CRC32.buf(imageBuffer);

    if (!force && crc === dialRuntime.lastCrc) {
        console.log(`⏭️  [${ticker} -> Dial ${dialNumber}]: No visual change.`);
        return;
    };

    await updateDial(state, uid, quote, imageBuffer);
    setDialRuntimeState(uid, { lastPrice: quote.currentPrice, lastCrc: crc });
    await sleep(1000);
    console.log(`✅ [${ticker} -> Dial ${dialNumber}]: Updated.`);
}

