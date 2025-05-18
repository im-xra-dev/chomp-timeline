import { Injectable } from '@nestjs/common';
import { strictEqual } from 'assert';
import { TlineCacherService } from '../tline-cacher/tline-cacher.service';
import { TLineCalculatorService } from '../t-line-calculator/t-line-calculator.service';
import { TLineCacheQueriesEnum } from '../../utils/TLineCacheQueriesEnum';
import { RawPost, SortedPost } from '../../utils/types';

type LocalCacheLookup = { [sec: string]: number };

@Injectable()
export class BatchCalculatorService {
    constructor(
        private readonly tlineCacheService: TlineCacherService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {}

    /**Calculates and ranks a batch of posts
     *
     * Worst case: O(n^2) for limited size of n
     * best case: O(n) if data is already sorted, or all posts are rejected
     * This runs concurrently to rank all the posts
     *
     * @param batch
     * @param rejectScore
     * @param userId
     */
    async batchCalculate(batch: readonly RawPost[], rejectScore: number, userId: string): Promise<SortedPost[]> {
        strictEqual(rejectScore >= 0, true, 'batchCalculate -> rejectScore must be >= 0');

        //The batch size should never be 0 so long as the total batches is <= total inputs
        //though this case should never occur, returning an empty array provides an elegant failsafe
        if (batch.length === 0) return [];

        //In the event of data overload, failsafe. This case handles both the for loop below, and
        //the sorting for loop, as both are bound by the batch length.
        if (batch.length > 1000) {
            console.error({
                batchLength: batch.length,
                message: 'failsafe triggered >> batchCalculate',
            });
            return [];
        }

        const seenDataLocalCacheRef: LocalCacheLookup = {};
        const sortedDataRef: SortedPost[] = [];

        //TODO get session id for user userId
        const sessId = "";

        //calculate scores for all posts in batch and sort them from best to worst
        //if a posts score indicates that it will never be used, reject it as there is no point processing it
        for (let i = 0; i < batch.length; i++) {
            const P: RawPost = batch[i];

            //TODO: if P.postState.sess === sessId, reject post

            //TODO: if queryCache(metadata, postId) exists, reject post

            //calculate the raw score for this post
            const rawScore: number = this.tlineCalculatorService.calculateRelevanceScore(
                P.secPersonalScore,
                P.postPersonalScore,
                P.authorsPersonalScore,
                P.thrRelationalScore,
                P.autRelation,
                P.secRelation,
                P.postState,
            );
            if (rawScore <= rejectScore) continue; //reject post

            const sec = P.sec;
            //calculate the weighted score based on how many have been seen from this category
            //this is to create variation in the feed so the same category doesnt come up many times in a row
            const seen: number = await this.getCachedSeenCount(seenDataLocalCacheRef, sec, userId);
            const weightScore: number = this.tlineCalculatorService.calculateTotalSeenWeight(
                rawScore,
                seen,
            );
            if (weightScore <= rejectScore) continue; //reject post

            //sort the un-rejected post
            this.sortHighToLow(sortedDataRef, {
                id: P.id,
                sec: sec,
                score: weightScore,
                seen: P.postState.seen,
                vote: P.postState.vote,
            });
            seenDataLocalCacheRef[sec]++;
        }

        return sortedDataRef;
    }

    //util: interfaces with the caches to figure out how many posts from 'sec' have been marked as seen
    // it first checks its local cache in seenDataRef.
    // if it does not exist locally, it queries from redis and writes it into the local cache (default to 0 if not found)
    async getCachedSeenCount(seenDataRef: LocalCacheLookup, sec: string, userId: string): Promise<number> {
        //return locally cached value if it exists
        if (seenDataRef[sec] !== undefined) return seenDataRef[sec];

        try {
            //set the local cache value by moving the redis cached value to local cache (defaults to 0 if not exists)
            const seenCount: unknown = await this.tlineCacheService.dispatch(
                TLineCacheQueriesEnum.GET_SEEN,
                { userId, sec },
            );
            if (seenCount === undefined) seenDataRef[sec] = 0;
            else seenDataRef[sec] = seenCount as number;

            return seenDataRef[sec];
        } catch (e) {
            //Failsafe with no data seen, though this error should be looked into
            //as it could indicate an issue with redis or a networking outage
            console.error(e);
            seenDataRef[sec] = 0;
            return 0;
        }
    }

    //util: sorts an individual post in to the already sorted array
    // worst case: O(n) if postToInsert has largest score
    // best case: O(1) if postToInsert has lowest score
    sortHighToLow(sortedInputRef: SortedPost[], postToInsert: SortedPost): void {
        //start at the end and shift each item over by 1
        // when it finds where the new item should go, insert it and ignore the rest (as theryre already sorted)
        for (let i = sortedInputRef.length - 1; i >= 0; i--) {
            if (sortedInputRef[i].score >= postToInsert.score) {
                sortedInputRef[i + 1] = postToInsert;
                return;
            } else sortedInputRef[i + 1] = sortedInputRef[i];
        }
        // as the loop never returned, that means every item got shifted over and it never found postToInserts slot
        // this means the only possible option is that postToInsert had the highest score, so it goes in the
        // slot left available at index 0
        sortedInputRef[0] = postToInsert;
    }
}
