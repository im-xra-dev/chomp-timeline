import { Injectable } from '@nestjs/common';
import { InitJobListing, JobResult } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { SESS_ID_EXPIRE } from '../../../configs/cache-expirations/expire';
import { GET_SESSION_KEY } from '../../../configs/cache-keys/keys';

@Injectable()
export class InitCacheService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    /**initJob
     *
     * This job initializes the cache with a new session ID
     *
     * @param job
     */
    async initJob(job: InitJobListing): Promise<JobResult> {
        //init constants
        const LOOKUP_KEY = GET_SESSION_KEY(job.userid);

        //initialize the client
        const client = await this.cacheService.getClient();

        //get the current cached value, only continue if it is not set
        const current = await client.get(LOOKUP_KEY);
        if (current !== null) return JobTypes.ABORT;

        //set the new session ID with an expiration time
        await client.set(LOOKUP_KEY, this.randomSessionId(), {EX: SESS_ID_EXPIRE});
        return JobTypes.CONTINUE;
    }

    //generate a random 6-digit hex string
    randomSessionId(): string {
        let out = '';
        for (let i = 0; i < 6; i++) out += Math.floor(Math.random() * 16).toString(16);
        return out;
    }
}
