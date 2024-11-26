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

    //todo refactor to calculator service
    /**calculateBatchCount
     * https://www.desmos.com/calculator/mglnoluywe
     * https://www.desmos.com/3d/alifqxuuke
     *
     * the time complexity graph for
     * y - total operations
     * x / n - input size
     * c - output size
     * i - batch size
     *
     * with
     * b - batch count = n / i
     *
     * graph of y = b(c+z) {1 <= b <= n} gives total operations at a given b (batch count)
     *   where z = (i(i + 1)) / 2
     *   is equation of the total operations per batch of size {1 <= i <= n}
     * has a min point that lies on y = (n/i) (( (i(i+1)) / 2 ) + c)
     *
     * min point lies on i = sqrt(2c)  for all values of c
     *
     * This simplifies to the 3-D graph of min-points for a given c,n input
     * y = (n/sqrt(2c))(c+((sqrt(2c))((sqrt(2c)) + 1)) / 2)
     **
     * @param inputSize
     * @param outputSize
     */
    calculateBatchCount(inputSize: number, outputSize: number): number {
        if (inputSize <= 0)
            throw new InvalidDataError('calculateBatchCount > inputSize', 'must be > 0')

        if (outputSize <= 0)
            throw new InvalidDataError('calculateBatchCount > outputSize', 'must be > 0')

        //min-point on curve is at idealBatchSize = sqrt(2c) from desmos
        const idealBatchSize = Math.sqrt(2 * outputSize);
        const batchCount = Math.ceil(inputSize / idealBatchSize);
        return batchCount;
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
        const bc = this.calculateBatchCount(inSize, outSize);
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

    //utility functions

    //return true every s iterations to break up data
    newBatch (i: number, s: number): boolean {
        return (i + 1) % s === 0;
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

    async rankPosts(job: JobListing): Promise<number> {
        //data in: raw post data


        // const cached = []; // precache for this job|user|mode
        // const sortedBatches = SortedPost[][]
        // const concurrentJobs = Promise<SortedPost[]>[]
        //


        //for top cachesize      //   set seen true
        //for any dropped from original cachesize //set seen false && sec total -- && clear postid's cache data


        //TODO: seperate out but this will insert into active tline
        //CACHE2 get cached users pool.  pop job.serve and push to live pool (O(n) // O(job.serve * 2))
        // these are the posts that get broadcast so that their content can be cached

        //return total added
        return 0;
    };



    async queryFollowedSectionPosts(postSlots: number) {
        //const secsAvaialab
        // x = calculateSectionsToQuery(postSlots: number, secsAvailable: number)
        //pop x sections from cache
        //query from neo || mock

        //rank posts (concurrent batch count set)

        //for each update and splice section into cache (based on sec normalized score && total seen)
    }

    //choose mode
    // x = calculateSectionsToQuery
    // pop top x
    // query
    //  remove seen
    //  calculate post score
    //  drop -ve, splice&seen +ve
    // update tobj attribs?
    // splice tobj based on calculateTotalSeenWeight(normalized, total seen)

}
