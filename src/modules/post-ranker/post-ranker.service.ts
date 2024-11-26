import {Injectable} from '@nestjs/common';
import {NeoQueryService} from '../neo-query/neo-query.service';
import {TlineCacherService} from '../tline-cacher/tline-cacher.service';
import {TLineCalculatorService} from '../t-line-calculator/t-line-calculator.service';
import {RawPost} from "../t-line/utils/types";
import {JobListing, SortedPost} from "../t-line/utils/types"
import {InvalidDataError} from "../../utils/InvalidDataError";

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

        //handles unevenly filled batches
        let leftover = inSize - notLeftovers;
        let jobBatch: RawPost[] = [];
        for (let i = 0; i < notLeftovers; i++) {
            jobBatch.push(rawPool[i]);//dispatch post

            if (this.newBatch(i, actualBatchSize)) {
                if (leftover > 0){ //dispatch overflow post
                    jobBatch.push(rawPool[inSize - leftover]);
                    leftover --;
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
        let sortedData: SortedPost[] = [];
        let sortingData: SortedPost[] = [];
        //for each post in batch
        //  call calculateRelevanceScore;
        //  drop -ve or 0score posts
        //  drop posts less than minScore
        //  for sortedData
        //    pop and push to sorting, adding current post
        //  sortedData = sortingData
        //  sortingData = []
        return sortedData;
    }

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
    async jobRunner(job: JobListing, batchRunners: ConcurrentBatch[]) {
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
        //       wB = calculateTotalSeenWeight
        //     else wB = -2
        //
        //     if first valid post is worse than worst in C then its already ordered
        //     if (b-discard === 0 && wB < lowest) sortingBC = sortedC; break;
        //     while c+b-discard <= job.cache
        //       sC_id = sortedC[c]
        //       wC = getWeight(sC_id);
        //       if (wC > wB) c++; sortingBC.push(sC_id); continue?
        //       b++; sortingBC.push(sB_elm.id)
        //       CACHE1 update section totalPosts data in :sec:[secid] ++
        //       CACHE1 update seen wB, sec, state etc
        //       break

    }

    //utility functions

    //return true every s iterations to break up data
    newBatch (i: number, s: number): boolean {
        return (i + 1) % s === 0;
    }
}
