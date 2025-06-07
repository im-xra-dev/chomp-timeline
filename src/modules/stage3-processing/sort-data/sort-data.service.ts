import { Injectable } from '@nestjs/common';
import { SortedPost } from '../../../utils/types';

export type CachedPostObj = { id: string; score: number };
export type PostDataLookup = {[key:string]: SortedPost};

@Injectable()
export class SortDataService {
    parseCurrentCachedData(redisData: readonly unknown[], skip: number): CachedPostObj[] {
        return [];
    }

    sortData(
        cacheMaxSize: number,
        currentCache: readonly CachedPostObj[],
        batchesToProcess: readonly SortedPost[][],
    ): {proposedCacheData: CachedPostObj[], postDataLookup: PostDataLookup} {

        // TODO for each proposedCacheData, postDataLookup[id] = SortedPost
        // TODO UPDATE TESTS

        return {proposedCacheData: [], postDataLookup: {}}
    }
}
