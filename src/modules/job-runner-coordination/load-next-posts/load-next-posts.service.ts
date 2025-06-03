import { Injectable } from '@nestjs/common';
import { JobResult, LoadJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { BroadcastCachePostsService } from '../../queue-management/broadcasters/broadcast-cache-posts/broadcast-cache-posts.service';
import { BroadcastNewJobService } from '../../queue-management/broadcasters/broadcast-new-job/broadcast-new-job.service';

@Injectable()
export class LoadNextPostsService {
    constructor(
        private readonly cacheService: RedisCacheDriverService,
        private readonly lockService: AquireMutexService,
        private readonly broadcastCachePostsService: BroadcastCachePostsService,
        private readonly broadcastNewJobService: BroadcastNewJobService,
    ) {}

    async loadJob(job: LoadJobListing): Promise<JobResult> {
        //move 'publish' qty of posts from the 'modes' caches to the finalpool cache
        return JobTypes.CONTINUE;
    }
}
