import {Injectable} from '@nestjs/common';
import {strictEqual} from 'assert'
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {TLineCacheQueriesEnum} from "../../utils/TLineCacheQueriesEnum";
import {RawPost, SortedPost} from "../t-line/utils/types";

@Injectable()
export class BatchCalculatorService {
    constructor(
        private readonly tlineCacheService: TlineCacherService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {
    }

    /**Calculates and ranks a batch of posts
     *
     * O(n^2) for limited size of n
     * This runs concurrently to rank all the posts
     *
     * @param batch
     * @param minScore
     */
    async batchCalculate(batch: RawPost[], minScore: number): Promise<SortedPost[]> {
        strictEqual(minScore >= 0, true, 'batchCalculate -> minScore must be >= 0');
        if (batch.length === 0) return [];

        const seenDataLocalCache: { [key: string]: number } = {};
        const sortedData: SortedPost[] = [];

        //calculate scores for all posts in batch and sort them from best to worst
        //if a posts score indicates that it will never be used, reject it as there is no point processing it
        for (let i = 0; i < batch.length; i++) {
            const P = batch[i];
            //calculate the raw score for this post
            const rawScore: number = this.tlineCalculatorService.calculateRelevanceScore(
                P.secRelationalScore, P.postPersonalScore, P.authorsPersonalScore,
                P.thrRelationalScore, P.autRelation, P.postState);
            if (rawScore <= minScore) continue; //reject post

            const sec: string = P.sec;
            //calculate the weighted score based on how many have been seen from this category
            //this is to create variation in the feed so the same category doesnt come up many times in a row
            const seen: number = await this.getCachedSeenCount(sec, seenDataLocalCache);
            const weightScore: number = this.tlineCalculatorService.calculateTotalSeenWeight(rawScore, seen);
            if (weightScore <= minScore) continue; //reject post

            //sort the un-rejected post
            this.sortHighToLow(sortedData,
                {id: P.id, sec: sec, score: weightScore, seen: P.postState.seen, vote: P.postState.vote});
            seenDataLocalCache[sec]++;
        }

        return sortedData;
    }

    //util: interfaces with the caches to figure out how many posts from 'sec' have been marked as seen
    // it first checks its local cache in seenDataRef. if it does not exist, it writes
    async getCachedSeenCount(sec: string, seenDataRef: { [key: string]: number }): Promise<number> {
        //return locally cached value if it exists
        if (seenDataRef[sec] !== undefined) return seenDataRef[sec];

        //set the local cache value by moving the redis cached value to local cache (defaults to 0 if not exists)
        try {
            const seenCount: unknown = await this.tlineCacheService.dispatch(TLineCacheQueriesEnum.GET_SEEN, {sec});
            if (seenCount === undefined) seenDataRef[sec] = 0;
            else seenDataRef[sec] = seenCount as number;

            return seenDataRef[sec];
        } catch (e) {
            console.error(e);
            seenDataRef[sec] = 0;
            return 0;
        }
    }

    //util: sorts an individual post in to the already sorted array
    // worst case: O(n)
    sortHighToLow(sortedInput: SortedPost[], postToInsert: SortedPost): void {
        //start at the end and shift each item over by 1
        // when it finds where the new item should go, insert it and ignore the rest (as theryre already sorted)
        for (let i = sortedInput.length - 1; i >= 0; i--) {
            if (sortedInput[i].score >= postToInsert.score) {
                sortedInput[i + 1] = postToInsert;
                return;
            } else sortedInput[i + 1] = sortedInput[i];
        }
        // as the loop never returned, that means every item got shifted over and it never found postToInserts slot
        // this means the only possible option is that postToInsert had the highest score, so it goes in the
        // slot left available at index 0
        sortedInput[0] = postToInsert;
    }
}
