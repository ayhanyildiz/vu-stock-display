import path from 'node:path';
import fs from 'node:fs/promises';
import type { AppConfig, Dial } from '@shared/models';
import { PATHS } from '../config/paths.ts';

let isWriting = false;

async function waitForWrite(): Promise<void> {
    while (isWriting) {
        await new Promise((r) => setTimeout(r, 5));
    }
}

export async function loadStoredState(): Promise<Partial<AppConfig>> {
    try {
        const data = await fs.readFile(PATHS.APP_STATE, 'utf-8');
        return JSON.parse(data) as Partial<AppConfig>;
    } catch (e: any) {
        if (e?.code === 'ENOENT') return {};
        throw e;
    }
}

export async function writeStoredState(state: Partial<AppConfig>): Promise<void> {
    await fs.mkdir(path.dirname(PATHS.APP_STATE), { recursive: true });

    const tmpPath = `${PATHS.APP_STATE}.${process.pid}.tmp`;
    const payload = JSON.stringify(state, null, 2);

    await fs.writeFile(tmpPath, payload, 'utf-8');
    await fs.rename(tmpPath, PATHS.APP_STATE);
}

export async function syncState(
    currentState: AppConfig,
    patch: Partial<AppConfig>
): Promise<AppConfig> {
    await waitForWrite();
    isWriting = true;

    try {
        const next: AppConfig = {
            ...currentState,
            ...patch,
        };

        await writeStoredState(next);

        return next;
    } finally {
        isWriting = false;
    }
}
