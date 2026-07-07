import { setTimeout as sleep } from 'node:timers/promises';
import { loadAppState } from './state.ts';
import { updateDialHardware } from './dial-service.ts';
import { prepareForRunTime } from './init-service.ts';

export async function startMonitor(): Promise<void> {
    console.log('🚀 Starting Stock Monitor...');

    let activeDials: string[] = [];
    try {
        ({ activeDials } = await prepareForRunTime());
    } catch (e) {
        console.error('prepareForRunTime failed:', e);
        await sleep(10_000);
        return startMonitor(); // or just keep retrying in a loop
    }

    while (true) {
        try {
            const intervalMs = await runMonitorTick(activeDials);
            await sleep(intervalMs);
        } catch (e) {
            console.error('Monitor tick failed:', e);
            await sleep(10_000);
        }
    }
}


async function runMonitorTick(activeDials: string[]): Promise<number> {
    const state = await loadAppState();

    if (activeDials.length > 0) {
        console.log(`\n--- Loop Start (${new Date().toLocaleTimeString()}) ---`);

        for (let i = 0; i < activeDials.length; i++) {
            const uid = activeDials[i];
            const ticker = state.dials?.[uid]?.ticker;
            const dialNumber = i + 1;

            if (!ticker) {
                console.log(`⏭️  [Dial ${dialNumber} ${uid}]: No ticker assigned.`);
                continue;
            }

            try {
                await updateDialHardware(state, uid, dialNumber);
            } catch (err: any) {
                console.error(`❌ ${ticker}:`, err?.message ?? err);
            }

            await sleep(1000);
        }
    }

    return state.settings.intervalMinutes * 60 * 1000;
}

