import { Injectable } from '@nestjs/common';
import { JobResult, LoadJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Injectable()
export class LoadNextPostsService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    async loadJob(job: LoadJobListing): Promise<JobResult> {
        //move from one cache to the other
        return JobTypes.CONTINUE;
    }
}
