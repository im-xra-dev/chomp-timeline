import { Injectable } from '@nestjs/common';
import { JobResult, LoadJobListing, QueryLoadJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { BroadcastCachePostsService } from '../../queue-management/broadcasters/broadcast-cache-posts/broadcast-cache-posts.service';
import { BroadcastNewJobService } from '../../queue-management/broadcasters/broadcast-new-job/broadcast-new-job.service';
import {
    GET_FINAL_POOL_KEY,
    GET_PRE_CACHE_KEY,
    GET_PRE_CACHE_LOCK_KEY,
} from '../../../configs/cache-keys/keys';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { defaults as PUBLISH_WEIGHTS } from '../../../configs/load-more-posts/publish-weightings';
import { strictEqual } from 'assert';
import randomString from '../../../utils/randomString';
import {
    FINAL_POOL_EXPIRE,
    PRE_CACHE_POOL_EXPIRE,
} from '../../../configs/cache-expirations/expire';

type ModeLocks = { [key: number]: AquiredLock };
type HeapObj = {
    mode: DiscoveryModes;
    frequency: number;
    priority: number;
};
type ParsedResults = {
    newJobModes: DiscoveryModes[];
    toCache: string[];
    missedCount: number;
};

@Injectable()
export class LoadNextPostsService {
    constructor(
        private readonly cacheService: RedisCacheDriverService,
        private readonly lockService: AquireMutexService,
        private readonly broadcastCachePostsService: BroadcastCachePostsService,
        private readonly broadcastNewJobService: BroadcastNewJobService,
    ) {}

    /**loadJob
     * moves 'publish' qty of posts from the 'modes' caches to the finalpool cache
     * discovery modes should be evenly distributed in the feed
     * broadcasts any relevant data to queues upon completion
     * all accessed cache pools should have their expirations updated
     *
     * @param job
     */
    async loadJob(job: LoadJobListing): Promise<JobResult> {
        strictEqual(job.modes.length > 0, true, 'load-next-result -> no discovery modes specified');

        const userId = job.userid;
        const modes = job.modes;
        const locks = await this.acquireLocks(modes, userId);
        const earliestExpiration = this.getEarliestLockExpiration(modes, locks);
        const { order, builder } = await this.buildBatch(userId, modes, locks, job.publish);

        //ensure locks are not expired before writing
        if (earliestExpiration < new Date().getTime()) {
            await this.releaseLocks(modes, locks);
            return JobTypes.ABORT;
        }

        //write the updates and remove all locks
        const result = (await builder.exec()) as unknown[];
        await this.releaseLocks(modes, locks);

        //broadcast queue messages
        await this.broadcastQueueMessages(userId, this.parseResults(result, order));

        return JobTypes.CONTINUE;
    }

    /**buildBatch
     * builds the batch of commands to send to Redis
     *
     * This batch moves all relevant posts from candidate pools to the final pool in the order
     * that they will be shown. It also updates the expiration times of all accessed pools.
     *
     * @param userId
     * @param modes
     * @param locks
     * @param publish
     * @private
     */
    private async buildBatch(
        userId: string,
        modes: DiscoveryModes[],
        locks: ModeLocks,
        publish: number,
    ) {
        const client = await this.cacheService.getClient();
        const builder = client.multi();
        const FINAL_POOL = GET_FINAL_POOL_KEY(userId);
        const heap: HeapObj[] = this.initializeHeap(modes);
        const order: DiscoveryModes[] = [];

        //add all the required posts to the redis builder
        for (let i = 0; i < publish; i++) {
            //move the next post from the specified pool and store order for future processing
            const mode = heap[0].mode;
            builder.lMove(locks[mode].dataPath, FINAL_POOL, 'LEFT', 'RIGHT');
            order.push(mode);

            //update the heap values
            heap[0].priority += heap[0].frequency;
            this.updateHeapOrder(heap);
        }

        //update expiration times of the utilised cache pools
        for (let i = 0; i < modes.length; i++)
            builder.expire(locks[modes[i]].dataPath, PRE_CACHE_POOL_EXPIRE);
        builder.expire(FINAL_POOL, FINAL_POOL_EXPIRE);

        return { builder, order };
    }

    /**initializeHeap
     * Evenly distributes the posts in the feed based on their Discovery Mode weighting
     *
     * This algorithm comes from:
     * https://blog.mischel.com/2015/03/26/evenly-distributing-items-in-a-list/
     *
     * @param modes
     * @private
     */
    private initializeHeap(modes: DiscoveryModes[]): HeapObj[] {
        const heap: HeapObj[] = [];
        const totalWeightScore = this.sumWeights(modes);

        //start by calculating the frequency that the discovery modes should appear in
        //add each mode to the heap
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i];
            const percent = PUBLISH_WEIGHTS[mode] / totalWeightScore;
            const frequency = 1 / percent;
            heap.push({ mode: mode, frequency: frequency, priority: frequency });
        }
        //order the initial heap
        this.updateHeapOrder(heap);
        return heap;
    }

    /**updateHeapOrder
     * re-orders the heap after each update
     *
     * @param refHeap
     * @private
     */
    private updateHeapOrder(refHeap: HeapObj[]) {
        refHeap.sort((a, b) => {
            if (a.priority === b.priority) return b.frequency - a.frequency;
            return a.priority - b.priority;
        });
    }

    /**parseResults
     * parses the results of the redis execution
     *
     * @param result
     * @param order
     * @private
     */
    private parseResults(result: unknown[], order: DiscoveryModes[]): ParsedResults {
        const newJobModes: DiscoveryModes[] = [];
        const toCache: string[] = [];
        let missedCount = 0;

        //for all results, if there was no data moved, then that mode requires a new load job
        //otherwise the post must be broadcast so other services can cache it
        for (let i = 0; i < result.length; i++) {
            //if pool had no posts available
            if (result[i] === null) {
                //increase miss count and if the mode has not been flagged, flag it
                missedCount++;
                if (!newJobModes.includes(order[i])) newJobModes.push(order[i]);
            } else {
                //post was moved, broadcast so that forum service can pre-cache it
                toCache.push(result[i] as string);
            }
        }

        return { newJobModes, toCache, missedCount };
    }

    /**broadcastQueueMessages
     * broadcasts the relevant data to the different queues
     *
     * @param userId
     * @param parsed
     * @private
     */
    private async broadcastQueueMessages(userId: string, parsed: ParsedResults) {
        if (parsed.toCache.length > 0)
            await this.broadcastCachePostsService.broadcastPosts(parsed.toCache);

        if (parsed.newJobModes.length > 0) {
            const newJob: QueryLoadJobListing = {
                userid: userId,
                jobType: JobTypes.QUERY_LOAD,
                jobid: randomString(8),
                modes: parsed.newJobModes,
                publish: parsed.missedCount,
            };
            await this.broadcastNewJobService.broadcastJob(newJob);
        }
    }

    /**acquireLocks
     * this function acquires locks on the different pre-cache pools in use
     *
     * @param modes
     * @param userId
     * @private
     */
    private async acquireLocks(modes: DiscoveryModes[], userId: string): Promise<ModeLocks> {
        //acquire locks on all the relevant cache stores
        const locks: ModeLocks = {};

        try {
            for (let i = 0; i < modes.length; i++)
                locks[modes[i]] = await this.lockService.aquireLock(
                    GET_PRE_CACHE_LOCK_KEY(userId, modes[i]),
                    GET_PRE_CACHE_KEY(userId, modes[i]),
                );
        } catch (e) {
            console.error(e);
            await this.releaseLocks(modes, locks);
            throw e;
        }
        return locks;
    }

    /**releaseLocks
     * releases locks. Ensures it exists in the lock object first as it could be
     * removing them as a result of an error while acquiring them
     *
     * @param modes
     * @param locks
     * @private
     */
    private async releaseLocks(modes: DiscoveryModes[], locks: ModeLocks) {
        //release locks on all the relevant cache stores
        for (let i = 0; i < modes.length; i++)
            if (locks[modes[i]] !== undefined) await this.lockService.releaseLock(locks[modes[i]]);
    }

    /**getEarliestLockExpiration
     * gets the timestamp of the first lock expiration
     *
     * @param modes
     * @param locks
     * @private
     */
    private getEarliestLockExpiration(modes: DiscoveryModes[], locks: ModeLocks): number {
        let earliest = locks[modes[0]].expAt;
        for (let i = 1; i < modes.length; i++)
            if (earliest > locks[modes[i]].expAt) earliest = locks[modes[i]].expAt;
        return earliest;
    }

    /**sumWeights
     * gets the total of all publish weights in order to calculate ratios
     *
     * @param MODES
     * @private
     */
    private sumWeights(MODES: DiscoveryModes[]): number {
        let sum = 0;
        for (let i = 0; i < MODES.length; i++) sum += PUBLISH_WEIGHTS[MODES[i]];
        return sum;
    }
}
