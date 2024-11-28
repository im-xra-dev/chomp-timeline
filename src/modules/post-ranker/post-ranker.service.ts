import {Injectable} from '@nestjs/common';
import {NeoQueryService} from '../neo-query/neo-query.service';
import {TlineCacherService} from '../tline-cacher/tline-cacher.service';
import {TLineCalculatorService} from '../t-line-calculator/t-line-calculator.service';
import {JobListing, RawPost, SortedPost} from "../t-line/utils/types";
import {InvalidDataError} from "../../utils/InvalidDataError";
import {TLineCacheQueriesEnum} from "../../utils/TLineCacheQueriesEnum";

type ConcurrentBatch = Promise<SortedPost[]>

@Injectable()
export class PostRankerService {
    constructor(
        private readonly neoQueryService: NeoQueryService,
        private readonly tlineCacheService: TlineCacherService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {
    }

    /**dispatchConcurrentPosts o(n)
     *
     * iterate over raw pool and dispatch all posts in batches
     *
     * if the final batch will not be full,
     * then it is more efficient to even out across the batches
     *
     * @param rawPool
     * @param job
     * @param minScore
     */
    dispatchConcurrentPosts(rawPool: RawPost[], outSize: number, minScore: number): ConcurrentBatch[] {
        const jobBuilder: ConcurrentBatch[] = [];
        const inSize = rawPool.length;
        const bc = this.tlineCalculatorService.calculateBatchCount(inSize, outSize);
        const actualBatchSize = Math.floor(inSize / bc);
        const notLeftovers = bc * actualBatchSize;

        let leftoverCounter = inSize - notLeftovers; //handles unevenly filled batches
        let jobBatch: RawPost[] = [];

        for (let i = 0; i < notLeftovers; i++) {
            jobBatch.push(rawPool[i]);//dispatch post

            if (this.newBatch(i, actualBatchSize)) {
                if (leftoverCounter > 0) { //dispatch overflow post
                    jobBatch.push(rawPool[inSize - leftoverCounter]);
                    leftoverCounter--;
                }
                //dispatch this batch and start next one
                jobBuilder.push(this.batchCalculate(jobBatch, minScore));
                jobBatch = [];
            }
        }
        return jobBuilder;
    }

    //O(n^2); run concurrently in batches add warning about time complexity graph
    async batchCalculate(batch: RawPost[], minScore: number): Promise<SortedPost[]> {
        if (minScore < 0) throw new InvalidDataError('batchCalculate > minScore', 'must be >= 0')
        if (batch.length === 0) return [];

        const seenData: { [key: string]: number } = {};
        let sortedData: SortedPost[] = [];

        for (let bI = 0; bI < batch.length; bI++) {
            const P = batch[bI]; // calculate raw score
            const rawScore = this.tlineCalculatorService.calculateRelevanceScore(
                P.secRelationalScore, P.postPersonalScore, P.authorsPersonalScore,
                P.thrRelationalScore, P.autRelation, P.postState);
            if (rawScore <= minScore) continue; //reject post

            const sec = P.sec; // calculate weighted score
            const seen: number = await this.getCachedSeenCount(sec, seenData);
            const weightScore = this.tlineCalculatorService.calculateTotalSeenWeight(rawScore, seen);
            if (weightScore <= minScore) continue; //reject post

            //sort the post
            const postBeingSorted = {score: weightScore, id: P.id, postState: P.postState, sec: P.sec};
            sortedData = this.sort(sortedData, postBeingSorted);
            seenData[sec]++;
        }

        return sortedData;
    }

    //util to interface with the cache
    async getCachedSeenCount(sec: string, seenData: { [key: string]: number }): Promise<number> {
        if (seenData[sec] !== undefined) return seenData[sec];

        const seenCount: unknown = await this.tlineCacheService.dispatch(TLineCacheQueriesEnum.GET_SEEN, {sec});
        if (seenCount === undefined) seenData[sec] = 0;
        else seenData[sec] = seenCount as number;

        return seenData[sec];
    }

    //util to sort an individual post in to the sorted array O(n)
    sort(sortedInput: SortedPost[], postBeingSorted: SortedPost): SortedPost[] {
        if (sortedInput.length === 0)
            return [postBeingSorted]; //first element already sorted
        const sortingWeight = postBeingSorted.score;

        //if new is smallest, push for O(1)
        if (sortedInput[sortedInput.length - 1].score >= sortingWeight) {
            sortedInput.push(postBeingSorted);
            return sortedInput;
        }

        //sort data
        const sortingOutput: SortedPost[] = [];
        const consumedCount = this.consumePosts(sortingWeight, 0, sortedInput, sortingOutput);
        sortingOutput.push(postBeingSorted);
        this.consumePosts(0, consumedCount, sortedInput, sortingOutput);

        return sortingOutput;
    }

    //util moves sorted posts to sorting array until it reaches the breakScore
    consumePosts = (breakScore: number, consumedCount: number, sortedInput: SortedPost[], sortingOutput: SortedPost[]): number => {
        while (consumedCount < sortedInput.length) {
            if (sortedInput[consumedCount].score < breakScore) break;
            sortingOutput.push(sortedInput[consumedCount]);
            consumedCount++;
        }
        return consumedCount
    };


    // n = number of posts found
    // c = specified cache size (constant)
    // i (dealBatchCount) = (Math.floor(Math.sqrt(2 * c))) (constant)
    // f = c/i (constant fraction that is the co-efficient in fn = rc)
    // r = number of runners (total batches)
    // r = n / i
    // b = n/r (posts per runner job)
    //r <= n
    //best no-action case iterates o(r) == o(n/i) -> o(n) -- already sorted (for each batch; nothing of interest)
    //worst no-action case iterates o(rb) == o(n) -- already all seen (for each batch; discard all b posts)
    //best re-order case iterates o(rc) == o(fn) -> o(n) -- none discarded, each batch (r) iterates over top [c] elements
    //worst re-order case iterates o(rb+rc)) == o(n + fn) == o((f+1)n) -> o(n) -- one in each batch kept; all others discarded. each batch iterates over b (posts) + c
    async jobRunner(job: JobListing, batchRunners: ConcurrentBatch[]): Promise<SortedPost[]> {
        // for each concurrent job
        //   sortedB = await concurrentJobs[i]
        //   sortedC = currentCache of length <= job.cache
        //   sortingBC = [];
        //   bool: cAtCapacity = cached.length === job.cache
        //   if cAtCapacity: lowest = getWeight(sortedC[last]);
        //   else lowest = -1;
        //   discard,b,c = 0;
        //   while  c+b-discard <= job.cache;
        //     if b < length of sortedB
        //       sB_elm = sortedB[b]
        //       if (seen sB_elm) b++; discard++; continue;
        //       wB = sB_elm weight
        //     else wB = -2
        //
        //     if first valid post is worse than worst in C then its already ordered
        //     if (b-discard === 0 && wB < lowest) sortingBC = sortedC; break;
        //     while c+b-discard <= job.cache
        //       sC_id = sortedC[c]
        //       wC = getWeight(sC_id);
        //       if (wC > wB) c++; sortingBC.push(sC_id); continue?
        //       b++; sortingBC.push(sB_elm.id)
        //       set:  seen && attrs && sec total ++
        //       CACHE1 update section totalPosts data in :sec:[secid] ++
        //       CACHE1 update seen wB, sec, state etc
        //       break
        return [];
    }

    //utility functions

    //return true every s iterations to break up data
    newBatch(i: number, s: number): boolean {
        return (i + 1) % s === 0;
    }
}
