import { Injectable } from '@nestjs/common';
import {ConcurrentBatch, QueryData} from "../../utils/types";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";

@Injectable()
export class BatchProcessorService {
    constructor(
        private readonly tlineCacherService: TlineCacherService,
    ) {}

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
    async processBatches(batchRunners: readonly ConcurrentBatch[]): Promise<QueryData> {
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
        return {};
    }
}
