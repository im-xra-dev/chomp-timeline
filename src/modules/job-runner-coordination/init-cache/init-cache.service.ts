import { Injectable } from '@nestjs/common';
import { InitJobListing, JobResult } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Injectable()
export class InitCacheService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    async initJob(job: InitJobListing): Promise<JobResult> {
        return JobTypes.CONTINUE;
    }
}
