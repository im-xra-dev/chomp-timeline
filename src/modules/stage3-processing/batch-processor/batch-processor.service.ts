import { Injectable } from '@nestjs/common';
import { ConcurrentBatch, SortedPost } from '../../../utils/types';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { SortDataService } from '../sort-data/sort-data.service';
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
        const batches: SortedPost[][] = [];
        for (let i = 0; i < batchRunners.length; i++) batches.push(await batchRunners[i]);

        //acquire a lock on the pool
        const lock = await this.lockService.aquireLock(
            GET_PRE_CACHE_LOCK_KEY(userId, mode),
            GET_PRE_CACHE_KEY(userId, mode),
        );

        const loadSizeFromCache = jobSizeCacheOverride === undefined;
        const rawInitialCacheData = await this.stage3CacheService.getCurrentPrecachePoolData(userId, lock, loadSizeFromCache);
        const cacheSize = loadSizeFromCache ? rawInitialCacheData[0] as number : jobSizeCacheOverride;
        const parsedInitialCacheData = this.sortDataService.parseCurrentCachedData(rawInitialCacheData, loadSizeFromCache ? 1 : 0);


        // TODO for each proposedCacheData, postDataLookup[id] = SortedPost
        const proposedCacheData = this.sortDataService.sortData(cacheSize, parsedInitialCacheData, batches);


        // TODO CachedPostObj to contain community
        // TODO {newPosts, removedPosts, communityCountChangeLookup} ??
        const {newPosts, removedPosts} = this.metadataService.getAdditionsAndRemovals(proposedCacheData, parsedInitialCacheData);

        if(lock.expAt < new Date().getTime() + BUFFER){
            //abort this attempt as there is less than the configured buffer time to update the caches
            await this.lockService.releaseLock(lock);
            return false;
        }

        const postDataLookup: {[key:string]: SortedPost} = {} //TODO
        const communityCountChangeLookup: {[key:string]: number} = {} //TODO

        const postMetaUpdateResults = await this.stage3CacheService.updatePostMetaData(newPosts, removedPosts, postDataLookup);
        const newGeneratedCache = this.metadataService.removePostsThatFailedMetaWrite(postMetaUpdateResults, newPosts, proposedCacheData);

        await this.stage3CacheService.updateThePoolData(lock, newGeneratedCache, communityCountChangeLookup);
        await this.lockService.releaseLock(lock);
        return true;
    }
}
