import { Injectable } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import {
    MUTEX_LOCK_EXPIRE,
    MUTEX_LOCK_FAILED_TIMEOUT_EXPIRE,
} from '../../../configs/cache-expirations/expire';
import { FAILSAFE_ACQUIRE_LOCK_RECURSION } from '../../../configs/failsafes/limits';
import { AcquireLockError } from '../../../errors/AcquireLockError';
import { InvalidDataError } from '../../../errors/InvalidDataError';

export type AquiredLock = {
    uniqueSignature: string;
    lockPath: string;
    dataPath: string;
    expAt: number;
};

@Injectable()
export class AquireMutexService {
    constructor(private readonly cacheClient: RedisCacheDriverService) {}

    async aquireLock(lockPath: string, dataPath: string, depth = 0): Promise<AquiredLock> {
        //initialize the client
        const client = await this.cacheClient.getClient();

        //init the data
        const signature = this.genUniqueSignature();
        const expAt = new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000;

        //attempt to get the lock
        const status = await client.set(lockPath, signature, {
            EX: MUTEX_LOCK_EXPIRE,
            NX: true,
        });

        //redis returns null when a value is set and configured to only set if it does not exist
        if (status === null) {
            //failsafe to stop infinite recursion
            if (depth >= FAILSAFE_ACQUIRE_LOCK_RECURSION)
                throw new AcquireLockError(lockPath, depth);

            return new Promise((resolve, reject) => {
                //jitter from (-1/2 * timeout) to (+1/2 * timeout) to de-sync attempts
                const timeoutMs = MUTEX_LOCK_FAILED_TIMEOUT_EXPIRE * 1000;
                const jitterMs = Math.floor(Math.random() * timeoutMs) - timeoutMs / 2;
                const totalTimeout = timeoutMs + jitterMs;

                //retry
                setTimeout(async () => {
                    try{
                        resolve(await this.aquireLock(lockPath, dataPath, depth + 1));
                    }catch (e) {
                        reject(e)
                    }
                }, totalTimeout);
            });
        }
        //redis returns status "OK" if setNX was successful
        if (status === 'OK') {
            return {
                dataPath: dataPath,
                lockPath: lockPath,
                uniqueSignature: signature,
                expAt: expAt,
            };
        }

        //throw if something unexpected happened
        throw new InvalidDataError('status', status);
    }

    async releaseLock(lock: AquiredLock): Promise<boolean> {
        //if the lock has expired, return false
        if (lock.expAt < new Date().getTime()) return false;

        //initialize the client
        const client = await this.cacheClient.getClient();

        //check the current lock held is the lock passed to this function
        const lockedSignature = await client.get(lock.lockPath);
        if (lockedSignature !== lock.uniqueSignature) return false;

        //release the lock
        await client.del(lock.lockPath);
        return true;
    }

    private genUniqueSignature() {
        let output = '';
        for (let i = 0; i < 6; i++) {
            output += Math.floor(Math.random() * 16).toString(16);
        }
        return output;
    }
}
