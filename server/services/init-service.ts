import type { AppConfig } from '@shared/models';
import { loadAppState, syncDialsFromHardware } from './state.ts';
import { syncState } from './storage.ts';
import { fetchActiveDials } from './vu-client.ts';

export async function prepareForRunTime(patch?: Partial<AppConfig>): Promise<{
    state: AppConfig;
    activeDials: string[];
    dialsChanged: boolean;
}> {
    let state = await loadAppState();

    if (patch) {
        state = await syncState(state, patch);
    }

    const activeDials = await fetchActiveDials(state);
    const { dialsPatch, dialsChanged } = syncDialsFromHardware(state, activeDials);

    if (dialsChanged) {
        state = await syncState(state, { dials: dialsPatch });
    }

    return { state, activeDials, dialsChanged };
}