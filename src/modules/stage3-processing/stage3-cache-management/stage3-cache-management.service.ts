import { Injectable } from '@nestjs/common';
import { SortedPost } from '../../../utils/types';
import { AquiredLock } from '../../redis/aquire-mutex/aquire-mutex.service';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

export type PerCommunityCounts = {
    [name: string]: number,
}

@Injectable()
export class Stage3CacheManagementService {
    constructor(
        private readonly cacheService: RedisCacheDriverService,
    ) {}

    async getCurrentPrecachePoolData(userId: string, lock: AquiredLock, loadCacheSize: boolean): Promise<unknown[]>{
        return [];
    }

    async updatePostMetaData(newPosts: readonly string[], removedPosts: readonly string[], postLookup: {[key:string]: SortedPost}): Promise<unknown[]>{
        return [];
    }

    async updateThePoolData(lock: AquiredLock, newPool: string[], perCommunityCountsLookup: PerCommunityCounts): Promise<void>{

    }

}
