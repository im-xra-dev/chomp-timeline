import { Injectable } from '@nestjs/common';
import { strictEqual } from 'assert';
import { TlineCacherService } from '../../tline-cacher/tline-cacher.service';
import { TLineCalculatorService } from '../t-line-calculator/t-line-calculator.service';
import { TLineCacheQueriesEnum } from '../../../utils/TLineCacheQueriesEnum';
import { RawPost, SortedPost } from '../../../utils/types';
import {
    failsafe,
    FAILSAFE_BATCH_SIZE,
} from '../../../configs/failsafes/limits';

type LocalCacheLookup = { [sec: string]: number };

@Injectable()
export class BatchCalculatorService {
    constructor(
        private readonly cacherService: TlineCacherService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {}

    /**Calculates and ranks a batch of posts
     *
     * Set up the processing environment for this batch
     *
     * Worst case: O(n^2) for limited size of n
     * best case: O(n) if data is already sorted, or all posts are rejected
     * This runs concurrently to rank all the posts
     *
     * @param batch
     * @param rejectScore
     * @param userId
     */
    async batchCalculate(
        batch: readonly RawPost[],
        rejectScore: number,
        userId: string,
    ): Promise<SortedPost[]> {
        strictEqual(rejectScore >= 0, true, 'batchCalculate -> rejectScore must be >= 0');

        //The batch size should never be 0 so long as the total batches is <= total inputs
        //though this case should never occur, returning an empty array provides an elegant failsafe
        if (batch.length === 0) return [];

        //In the event of data overload, failsafe. This case handles both the for loop below, and
        //the sorting for loop, as both are bound by the batch length.
        failsafe(batch.length > FAILSAFE_BATCH_SIZE, { batchLength: batch.length });

        //local storage for this process
        const seenDataLocalCacheRef: LocalCacheLookup = {};
        const sortedDataRef: SortedPost[] = [];

        // get session id for user userId
        const sessId = await this.cacherService.dispatch(TLineCacheQueriesEnum.GET_SESSION_ID, {
            userId,
        });

        //calculate scores for all posts in batch and sort them from best to worst
        //if a posts score indicates that it will never be used, reject it as there is no point processing it
        for (let i = 0; i < batch.length; i++) {
            await this.processPost_mutatesSeenCacheAndSortedList(
                userId,
                sessId as string, //TODO fix when cache <T> setup
                sortedDataRef,
                seenDataLocalCacheRef,
                batch[i],
                rejectScore,
            );
        }

        return sortedDataRef;
    }

    //util: processes the individual post
    // this function handles the calculation of weights, rejection and insertion of an individual post
    private async processPost_mutatesSeenCacheAndSortedList(
        userId: string,
        sessId: string,
        sortedDataRef: SortedPost[],
        seenDataLocalCacheRef: LocalCacheLookup,
        rawPost: RawPost,
        rejectScore: number,
    ) {
        //if the author or community are muted, reject this post
        if (rawPost.autRelation.muted) return;
        if (rawPost.secRelation.muted) return;

        // if the user last viewed this post in the current session, reject post
        if (rawPost.postState.sess === sessId) return;

        //TODO:::: IMPORTANT this should be batched outside of loop !!!!!
        //TODO:::: per community seen count too
        //TODO:::: sessid in same batch
        const inMetadata = await this.cacherService.dispatch(
            TLineCacheQueriesEnum.EXISTS_IN_METADATA,
            { userId, postId: rawPost.id },
        );

        // if the post is already in a cached pool, reject post
        if (inMetadata) return;

        //calculate the raw score for this post
        const rawScore: number = this.tlineCalculatorService.calculateRelevanceScore(
            rawPost.secPersonalScore,
            rawPost.postPersonalScore,
            rawPost.authorsPersonalScore,
            rawPost.thrRelationalScore,
            rawPost.autRelation,
            rawPost.secRelation,
            rawPost.postState,
        );
        if (rawScore <= rejectScore) return; //reject post

        //get total posts from this category that have been seen
        const seen: number = await this.getOrInitializeCachedSeenCount(
            seenDataLocalCacheRef,
            rawPost.sec,
            userId,
        );

        //calculate the weighted score based on how many have been seen from this category
        //this is to create variation in the feed so the same category doesnt come up many times in a row
        const weightScore: number = this.tlineCalculatorService.calculateTotalSeenWeight(
            rawScore,
            seen,
        );
        if (weightScore <= rejectScore) return; //reject post

        //sort the un-rejected post and update seen cache
        this.insertPostInPlaceHighToLow(sortedDataRef, rawPost, weightScore);
        seenDataLocalCacheRef[rawPost.sec]++;
    }

    //util: interfaces with the caches to figure out how many posts from 'sec' have been marked as seen
    // it first checks its local cache in seenDataRef.
    // if it does not exist locally, it queries from redis and writes it into the local cache (default to 0 if not found)
    async getOrInitializeCachedSeenCount(
        seenDataRef: LocalCacheLookup,
        sec: string,
        userId: string,
    ): Promise<number> {
        //return locally cached value if it exists
        if (seenDataRef[sec] !== undefined) return seenDataRef[sec];

        try {
            //set the local cache value by moving the redis cached value to local cache (defaults to 0 if not exists)
            const seenCount: unknown = await this.cacherService.dispatch(
                TLineCacheQueriesEnum.GET_SEEN_COUNT_PER_COMMUNITY,
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
    insertPostInPlaceHighToLow(
        sortedInputRef: SortedPost[],
        rawPost: RawPost,
        weightScore: number,
    ): void {
        const postToInsert: SortedPost = {
            id: rawPost.id,
            sec: rawPost.sec,
            score: weightScore,
            seen: rawPost.postState.seen,
            vote: rawPost.postState.vote,
        };

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
