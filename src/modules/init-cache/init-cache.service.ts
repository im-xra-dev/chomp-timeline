import { Injectable } from '@nestjs/common';
import { InitJobListing, JobResult } from '../../utils/types';
import { JobTypes } from '../../utils/JobTypes';
import { TlineCacherService } from '../tline-cacher/tline-cacher.service';

@Injectable()
export class InitCacheService {
    constructor(private readonly tlineCacherService: TlineCacherService) {}

    async initJob(job: InitJobListing): Promise<JobResult> {
        return JobTypes.CONTINUE;
    }
}
