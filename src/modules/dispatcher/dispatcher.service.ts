import {Injectable} from '@nestjs/common';
import {TLineCalculatorService} from '../t-line-calculator/t-line-calculator.service';
import {BatchCalculatorService} from '../batch-calculator/batch-calculator.service';
import {RawPost, ConcurrentBatch} from "../../utils/types";
import {strictEqual} from "assert";


@Injectable()
export class DispatcherService {
    constructor(
        private readonly batchCalculatorService: BatchCalculatorService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {
    }

    /**dispatchConcurrentPosts o(n)
     *
     * iterate over raw pool and dispatch all posts in batches
     *
     * if the final batch will not be full,
     * then it is more efficient to even out across the batches rather than
     * filling all but the last batch to the max
     *
     * @param rawPool
     * @param outSize
     * @param minScore
     */
    dispatchConcurrentPosts(rawPool: RawPost[], outSize: number, minScore: number): ConcurrentBatch[] {
        strictEqual(outSize > 0, true,
            'dispatchConcurrentPosts -> outSize must be > 0');

        strictEqual(minScore >= 0, true,
            'dispatchConcurrentPosts -> minScore must be >= 0');

        const jobBuilder: ConcurrentBatch[] = [];
        const inSize = rawPool.length;
        //calculates the number of batches that should be dispatched to optimally calculate this data
        const bc = this.tlineCalculatorService.calculateBatchCount(inSize, outSize);
        //based on the number of batches to dispatch, calculate how many posts should fit in each
        //and calculate how many "overflow" posts there will be (because decimal qtys of posts dont exist)
        const actualBatchSize = Math.floor(inSize / bc);
        const notLeftovers = bc * actualBatchSize;
        const leftover = inSize - notLeftovers;

        //This for loop processes all the batches, filling them with the required post size
        //handling any of the overflow posts and finally dispatching the job to the jobBuilder
        for (let batchesProcessed = 0; batchesProcessed < bc; batchesProcessed++) {
            const jobBatch: RawPost[] = [];

            //add the next actualBatchSize posts to the batch. This is the calculated size of each batch
            for (let i = 0; i < actualBatchSize; i++) jobBatch.push(rawPool[i + (actualBatchSize * batchesProcessed)]);

            //as we cannot add, say, 7.5 posts per batch when handling 15 posts across 2 batches,
            //the calculated batch size will be 7. This leaves one post to insert after the first 14 are complete

            //if we add one overflow post per batch, we will evenly distribute them as best we can
            //and so we can take the overflow posts from the end. This takes one per batch for every
            //leftover post, so while the number leftover is greater than the number processed, add one more
            if (leftover > batchesProcessed) jobBatch.push(rawPool[inSize - batchesProcessed - 1]);

            //we can then dispatch the job to the batch calculator, and push the promised calculation
            //to the job builder so that the JobRunner can pick them up and process them later
            jobBuilder.push(this.batchCalculatorService.batchCalculate(jobBatch, minScore));
        }

        return jobBuilder;
    }
}
