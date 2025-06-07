import { Injectable } from '@nestjs/common';
import { ConcurrentBatch, SortedPost } from '../../../utils/types';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { CachedPostObj, PostDataLookup, SortDataService } from '../sort-data/sort-data.service';
import { MetadataManagementService } from '../metadata-management/metadata-management.service';
import { Stage3CacheManagementService } from '../stage3-cache-management/stage3-cache-management.service';
import { GET_PRE_CACHE_KEY, GET_PRE_CACHE_LOCK_KEY } from '../../../configs/cache-keys/keys';
import { BUFFER } from '../../../configs/stage-3-lock-buffer/config';

@Injectable()
export class BatchProcessorService {
    constructor(
        private readonly lockService: AquireMutexService,
        private readonly sortDataService: SortDataService,
        private readonly metadataService: MetadataManagementService,
        private readonly stage3CacheService: Stage3CacheManagementService,
    ) {}

    async processBatches(
        userId: string,
        mode: DiscoveryModes,
        batchRunners: readonly ConcurrentBatch[],
        jobSizeCacheOverride?: number,
    ): Promise<boolean> {
        //wait for the concurrent batches to finish processing
        const batches = await this.accumulateBatches(batchRunners);

        //acquire a lock on the pool
        const lock = await this.getLock(userId, mode);

        //query cache and parse data
        const { parsedInitialCacheData, cacheSize } = await this.queryAndParseCache(
            userId,
            lock,
            jobSizeCacheOverride,
        );

        //sort the batches with the cache data
        const { proposedCacheData, postDataLookup } = this.sortDataService.sortData(
            cacheSize,
            parsedInitialCacheData,
            batches,
        );

        //finalize and write the new cache
        return await this.writeNewCache(
            proposedCacheData,
            parsedInitialCacheData,
            lock,
            postDataLookup,
        );
    }

    private async queryAndParseCache(
        userId: string,
        lock: AquiredLock,
        jobSizeCacheOverride: number,
    ): Promise<{
        parsedInitialCacheData: CachedPostObj[];
        cacheSize: number;
    }> {
        //init vars
        const loadSizeFromCache = jobSizeCacheOverride === undefined;

        //query cache
        const rawInitialCacheData = await this.stage3CacheService.getCurrentPrecachePoolData(
            userId,
            lock,
            loadSizeFromCache,
        );

        //parse data pool
        const parsedInitialCacheData = this.sortDataService.parseCurrentCachedData(
            rawInitialCacheData,
            loadSizeFromCache ? 1 : 0,
        );

        //parse cache size
        const cacheSize = loadSizeFromCache
            ? (rawInitialCacheData[0] as number)
            : jobSizeCacheOverride;

        return { parsedInitialCacheData, cacheSize };
    }

    private async writeNewCache(
        proposedCacheData: CachedPostObj[],
        parsedInitialCacheData: CachedPostObj[],
        lock: AquiredLock,
        postDataLookup: PostDataLookup,
    ): Promise<boolean> {
        //gets data about what has changed
        const { newPosts, removedPosts, communityCountChangeLookup } =
            this.metadataService.getAdditionsAndRemovals(proposedCacheData, parsedInitialCacheData);

        //ensures there is still a valid lock with buffer time to perform all writes
        if (await this.isLockInvalid(lock)) return false;

        //updates the metadata for individual posts
        const postMetaUpdateResults = await this.stage3CacheService.updatePostMetaData(
            newPosts,
            removedPosts,
            postDataLookup,
        );

        //generates the final pool of data (removes any posts that could not have metadata set)
        const newGeneratedCache = this.metadataService.removePostsThatFailedMetaWrite(
            postMetaUpdateResults,
            newPosts,
            proposedCacheData,
        );

        //write the final pool of data to the cache
        await this.stage3CacheService.updateThePoolData(
            lock,
            newGeneratedCache,
            communityCountChangeLookup,
        );

        //release the lock
        await this.lockService.releaseLock(lock);
        return true;
    }

    private async accumulateBatches(
        batchRunners: readonly ConcurrentBatch[],
    ): Promise<SortedPost[][]> {
        const batches: SortedPost[][] = [];
        for (let i = 0; i < batchRunners.length; i++) batches.push(await batchRunners[i]);
        return batches;
    }

    private async getLock(userId: string, mode: DiscoveryModes) {
        return await this.lockService.aquireLock(
            GET_PRE_CACHE_LOCK_KEY(userId, mode),
            GET_PRE_CACHE_KEY(userId, mode),
        );
    }

    private async isLockInvalid(lock: AquiredLock) {
        if (lock.expAt < new Date().getTime() + BUFFER) {
            //abort this attempt as there is less than the configured buffer time to update the caches
            await this.lockService.releaseLock(lock);
            return true;
        }
        return false;
    }
}
