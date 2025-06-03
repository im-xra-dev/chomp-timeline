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

type ModeLocks = { [key: number]: AquiredLock };
type HeapObj = {
    mode: DiscoveryModes;
    frequency: number;
    priority: number;
};

@Injectable()
export class LoadNextPostsService {
    constructor(
        private readonly cacheService: RedisCacheDriverService,
        private readonly lockService: AquireMutexService,
        private readonly broadcastCachePostsService: BroadcastCachePostsService,
        private readonly broadcastNewJobService: BroadcastNewJobService,
    ) {}

    //move 'publish' qty of posts from the 'modes' caches to the finalpool cache
    async loadJob(job: LoadJobListing): Promise<JobResult> {
        strictEqual(job.modes.length > 0, true, 'load-next-result -> no discovery modes specified');

        //init data
        const userId = job.userid;
        const modes = job.modes;
        const locks = await this.acquireLocks(modes, userId);
        const earliestExpiration = this.getEarliestLockExpiration(modes, locks);
        const client = await this.cacheService.getClient();
        const builder = client.multi();
        const FINAL_POOL = GET_FINAL_POOL_KEY(userId);
        const heap: HeapObj[] = this.initializeHeap(modes);
        const order: DiscoveryModes[] = [];

        //for every post that is to be added
        for (let i = 0; i < job.publish; i++) {
            //move the next post from the specified pool
            const mode = heap[0].mode;
            builder.lMove(locks[mode].dataPath, FINAL_POOL, 'LEFT', 'RIGHT');

            //store order for future processing
            order.push(mode);

            //update the heap values
            heap[0].priority += heap[0].frequency;
            this.updateHeapOrder(heap);
        }

        //ensure locks are not expired before writing
        if (earliestExpiration < new Date().getTime()) {
            await this.releaseLocks(modes, locks);
            return JobTypes.ABORT;
        }

        //write the updates and remove all locks
        const result = (await builder.exec()) as unknown[];
        await this.releaseLocks(modes, locks);
        const parsed = this.parseResults(result, order);

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

        return JobTypes.CONTINUE;
    }

    private parseResults(
        result: unknown[],
        order: DiscoveryModes[],
    ): { newJobModes: DiscoveryModes[]; toCache: string[]; missedCount: number } {
        const newJobModes: DiscoveryModes[] = [];
        const toCache: string[] = [];
        let missedCount = 0;

        //for all results, if there was no data moved, then that mode requires a new load job
        //otherwise the post must be broadcast so other services can cache it
        for (let i = 0; i < result.length; i++) {
            if (result[i] === null) {
                missedCount++;
                if (!newJobModes.includes(order[i])) newJobModes.push(order[i]);
            } else toCache.push(result[i] as string);
        }

        return { newJobModes, toCache, missedCount };
    }

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

    private updateHeapOrder(refHeap: HeapObj[]) {
        refHeap.sort((a, b) => {
            if (a.priority === b.priority) return b.frequency - a.frequency;
            return a.priority - b.priority;
        });
    }

    private async acquireLocks(modes: DiscoveryModes[], userId: string): Promise<ModeLocks> {
        //acquire locks on all the relevant cache stores
        const locks: ModeLocks = {};
        for (let i = 0; i < modes.length; i++)
            locks[modes[i]] = await this.lockService.aquireLock(
                GET_PRE_CACHE_LOCK_KEY(userId, modes[i]),
                GET_PRE_CACHE_KEY(userId, modes[i]),
            );
        return locks;
    }

    private async releaseLocks(modes: DiscoveryModes[], locks: ModeLocks) {
        //release locks on all the relevant cache stores
        for (let i = 0; i < modes.length; i++) await this.lockService.releaseLock(locks[modes[i]]);
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

    private sumWeights(MODES: DiscoveryModes[]): number {
        let sum = 0;
        for (let i = 0; i < MODES.length; i++) sum += PUBLISH_WEIGHTS[MODES[i]];
        return sum;
    }
}
