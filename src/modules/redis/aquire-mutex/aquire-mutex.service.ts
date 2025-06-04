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

    /**aquireLock
     * Acquires a new lock on the redis database.
     * if available, lock is resolved immediately
     * if not, the system will re-attempt acquiring the lock until successful
     * if there are too many unsuccessful attempts, a failsafe is triggered, terminating the attempt
     *
     * @param lockPath
     * @param dataPath
     * @param depth
     */
    async aquireLock(lockPath: string, dataPath: string, depth = 0): Promise<AquiredLock> {
        //initialize the client
        const client = await this.cacheClient.getClient();

        //init the data
        const signature = this.genUniqueSignature();
        const expAt = new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000;

        //attempt to set the lock with the generated signature
        const status = await client.set(lockPath, signature, {
            EX: MUTEX_LOCK_EXPIRE,
            NX: true,
        });

        //redis returns null when a value is already set and using NX:true (lock held by another process)
        if (status === null) return this.waitForLock(lockPath, dataPath, depth);

        //redis returns status "OK" if setNX was successful
        //this means the lock was acquired
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

    /**releaseLock
     * releases the lock held by the system
     *
     * @param lock
     */
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

    /**waitForLock
     * handles calculating the wait time to retry and get a lock
     *
     * @param lockPath
     * @param dataPath
     * @param depth
     * @private
     */
    private async waitForLock(lockPath: string, dataPath: string, depth: number): Promise<AquiredLock>{
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

    /**genUniqueSignature
     * generates a unique 6 digit code to sign the lock with
     * this ensures that the lock can be identified from other potential
     * clients who may be attempting to acquire the lock
     *
     * @private
     */
    private genUniqueSignature() {
        let output = '';
        for (let i = 0; i < 6; i++) {
            output += Math.floor(Math.random() * 16).toString(16);
        }
        return output;
    }
}
