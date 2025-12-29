import type { AppConfig, Dial, DialState } from '@shared/models';
import { loadStoredState } from './storage.ts';
import { defaultVuServer, defaultSettings, defaultTickers } from '../config/defaults.ts';

const dialRuntime = new Map<string, DialState>();

export function getDialRuntimeState(uid: string): DialState {
    let dialState = dialRuntime.get(uid);
    if (!dialState) {
        dialState = { lastPrice: 0, lastCrc: null };
        setDialRuntimeState(uid, dialState);
    }

    return dialState;
}

export function setDialRuntimeState(uid: string, next: DialState): void {
    dialRuntime.set(uid, next);
}

export function resetDialRuntime(uid: string): void {
    dialRuntime.set(uid, { lastPrice: 0, lastCrc: null });
}

export async function loadAppState(): Promise<AppConfig> {
    const data = await loadStoredState();

    return {
        vuServer: { ...defaultVuServer, ...data.vuServer },
        settings: { ...defaultSettings, ...data.settings },
        logoDevToken: data.logoDevToken ?? '',
        dials: data.dials ?? {},
    };
}

export function syncDialsFromHardware(
    config: AppConfig,
    activeDials: string[]
): { dialsPatch: Record<string, Dial>, dialsChanged: boolean } {
    const prev = config.dials ?? {};
    const next: Record<string, Dial> = {};
    let changed = false;

    for (let i = 0; i < activeDials.length; i++) {
        const uid = activeDials[i];
        const existing = prev[uid];

        if (existing) {
            next[uid] = existing;
        } else {
            next[uid] = { ticker: defaultTickers[i] ?? '' };
            changed = true;
        }
    }

    return { dialsPatch: next, dialsChanged: changed };
}
