import { Injectable } from '@nestjs/common';
import { CacheClearJobListing, JobResult } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Injectable()
export class ClearCacheService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    async clearCacheJob(job: CacheClearJobListing): Promise<JobResult> {
        return JobTypes.CONTINUE;
    }
}
