import { FailsafeError } from '../../utils/FailsafeError';

export function failsafe(trigger: boolean, dataToLog: { [key: string]: unknown }) {
    if (trigger) throw new FailsafeError(dataToLog);
}

export const FAILSAFE_BATCH_SIZE = 1000;
export const FAILSAFE_BATCH_COUNT = 50;
