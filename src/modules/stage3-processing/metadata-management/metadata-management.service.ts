import { Injectable } from '@nestjs/common';
import { CachedPostObj } from '../sort-data/sort-data.service';

export type CommunityLookup = { [key: string]: number };

@Injectable()
export class MetadataManagementService {
    getAdditionsAndRemovals(
        proposedCache: readonly CachedPostObj[],
        originalCache: readonly CachedPostObj[],
    ): { newPosts: string[], removedPosts: string[], communityCountChangeLookup: CommunityLookup } {
        const newPosts: string[] = [];
        const removedPosts: string[] = [];
        const communityCountChangeLookup: CommunityLookup = {}; //TODO REWRITE TESTS

        return { newPosts, removedPosts, communityCountChangeLookup };
    }

    /**removePostsThatFailedMetaWrite
     * returns a list of IDs that are to be the new cache pool
     *
     * @param redisData
     * @param newPosts
     * @param proposedCache
     */
    removePostsThatFailedMetaWrite(
        redisData: readonly unknown[],
        newPosts: readonly string[],
        proposedCache: readonly CachedPostObj[],
    ): string[] {
        return [];
    }
}
