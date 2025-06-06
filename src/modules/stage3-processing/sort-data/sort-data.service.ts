import { Injectable } from '@nestjs/common';
import { SortedPost } from '../../../utils/types';

export type cachedPostObj = { id: string; score: number };

@Injectable()
export class SortDataService {
    parseCurrentCachedData(redisData: readonly unknown[], skip: number): cachedPostObj[] {
        return [];
    }

    sortData(
        cacheMaxSize: number,
        currentCache: readonly cachedPostObj[],
        batchesToProcess: readonly SortedPost[][],
    ): cachedPostObj[] {
        return [];
    }
}
