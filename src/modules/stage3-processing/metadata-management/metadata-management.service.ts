import { Injectable } from '@nestjs/common';
import { cachedPostObj } from '../sort-data/sort-data.service';

@Injectable()
export class MetadataManagementService {

    getAdditionsAndRemovals(proposedCache: readonly cachedPostObj[], originalCache: readonly cachedPostObj[]): {newPosts: string[], removedPosts: string[]}{
        const newPosts: string[] = [];
        const removedPosts: string[] = [];

        return {newPosts, removedPosts}
    }

    /**removePostsThatFailedMetaWrite
     * returns a list of IDs that are to be the new cache pool
     *
     * @param redisData
     * @param newPosts
     * @param proposedCache
     */
    removePostsThatFailedMetaWrite(redisData: readonly unknown[], newPosts: readonly string[], proposedCache: readonly cachedPostObj[]): string[]{
        return []
    }
}
