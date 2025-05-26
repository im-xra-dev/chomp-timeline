import { Injectable } from '@nestjs/common';
import { TlineCacherService } from '../../tline-cacher/tline-cacher.service';
import { CacheClearJobListing, JobResult } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';

@Injectable()
export class ClearCacheService {
    constructor(private readonly tlineCacherService: TlineCacherService) {}

    async clearCacheJob(job: CacheClearJobListing): Promise<JobResult> {
        return JobTypes.CONTINUE;
    }
}
