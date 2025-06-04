import { Injectable } from '@nestjs/common';
import { CacheClearJobListing, JobResult } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import {
    GET_CACHE_SIZE_KEY, GET_FINAL_POOL_KEY, GET_METADATA_KEY,
    GET_PER_CACHE_LIMIT_KEY,
    GET_PER_CACHE_SKIP_KEY,
    GET_PRE_CACHE_KEY,
    GET_PRE_CACHE_LOCK_KEY,
    GET_SESSION_KEY,
} from '../../../configs/cache-keys/keys';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import cleanupModes from '../../../configs/pre-cache-configuration/cleanup-modes';

@Injectable()
export class ClearCacheService {
    constructor(
        private readonly cacheService: RedisCacheDriverService,
        private readonly lockService: AquireMutexService,
    ) {}

    /**clearCacheJob
     * clears a users cache
     *
     * percategory is left to expire on its own
     *
     * @param job
     */
    async clearCacheJob(job: CacheClearJobListing): Promise<JobResult> {
        //init data
        const userId = job.userid;
        const client = await this.cacheService.getClient();
        const builder = client.multi();

        //delete the sessions id
        builder.del(GET_SESSION_KEY(userId));

        //delete all pre-cache pool data
        for(let i = 0; i < cleanupModes.length; i++){
            //loads the cached posts to delete their metadata later
            builder.lRange(GET_PRE_CACHE_KEY(userId, cleanupModes[i]), 0, -1);

            //clears the cache, and its skip/limit/size configuration
            builder.del(GET_PRE_CACHE_KEY(userId, cleanupModes[i]));
            builder.del(GET_PER_CACHE_SKIP_KEY(userId, cleanupModes[i]));
            builder.del(GET_PER_CACHE_LIMIT_KEY(userId, cleanupModes[i]));
            builder.del(GET_CACHE_SIZE_KEY(userId, cleanupModes[i]));
        }

        //delete final pool data and its cache size.
        // also gets posts stored here to delete their metadata later
        builder.lRange(GET_FINAL_POOL_KEY(userId), 0, -1);
        builder.del(GET_FINAL_POOL_KEY(userId));
        builder.del(GET_CACHE_SIZE_KEY(userId, "finalpool"));

        //acquire locks, run the batch and finally release locks
        const locks: AquiredLock[] = await this.acquireLocks(userId);
        const output = await builder.exec();
        await this.releaseLocks(locks);

        //returned data contains status codes for deletion and postIds stored
        //in caches. We want to retrieve the postIds and parse them into their
        //associated metadata keys to clear the metadata
        const metadataKeys = this.parseOutput(userId, output);
        await client.del(metadataKeys);

        return JobTypes.CONTINUE;
    }

    /**parseOutput
     * parses the list of status codes and data returned by the batch process
     * and extracts all the post IDs
     *
     * these post IDs are then re-formatted into the key that links to their associated
     * metadata stored in the cache. This list of keys is then returned
     *
     * @param userId
     * @param output
     * @private
     */
    private parseOutput(userId: string, output: unknown[]): string[]{
        const outputKeys: string[] = [];

        //for all output data, find the arrays returned
        for(let i = 0; i < output.length; i++){
            const dataUnknown: unknown = output[i];

            if(Array.isArray(dataUnknown)){
                //each element is a post ID, which must be converted to its
                //metadata cache key
                const dataArray: string[] = dataUnknown as string[];
                for(let ii = 0; ii < dataArray.length; ii++){
                    outputKeys.push(GET_METADATA_KEY(userId, dataArray[ii]));
                }
            }
        }
        return outputKeys;
    }

    /**acquireLocks
     *
     * acquires all the locks and throws if an error occurred (releasing acquired locks first)
     *
     * @param userId
     * @private
     */
    private async acquireLocks(userId: string): Promise<AquiredLock[]> {
        const locks: AquiredLock[] = [];
        try {
            for (let i = 0; i < cleanupModes.length; i++) {
                locks.push(
                    await this.lockService.aquireLock(
                        GET_PRE_CACHE_LOCK_KEY(userId, cleanupModes[i]),
                        GET_PRE_CACHE_KEY(userId, cleanupModes[i]),
                    ),
                );
            }
        } catch (e) {
            await this.releaseLocks(locks);
            throw e;
        }
        return locks;
    }

    /**releaseLocks
     * it releases the acquired locks (wow I could have never guessed that)
     *
     * @param locks
     * @private
     */
    private async releaseLocks(locks: AquiredLock[]){
        for (let i = 0; i < locks.length; i++) await this.lockService.releaseLock(locks[i]);
    }
}
