import { Injectable } from '@nestjs/common';
import { TlineCacherService } from '../../tline-cacher/tline-cacher.service';
import { JobResult, LoadJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';

@Injectable()
export class LoadNextPostsService {
    constructor(private readonly tlineCacherService: TlineCacherService) {}

    async loadJob(job: LoadJobListing): Promise<JobResult> {
        //move from one cache to the other
        return JobTypes.CONTINUE;
    }
}
