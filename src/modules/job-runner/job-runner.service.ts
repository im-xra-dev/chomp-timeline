import { Injectable } from '@nestjs/common';
import {
    JobResult,
    CacheClearJobListing,
    InitJobListing,
    LoadJobListing,
    QueryJobListing,
    QueryLoadJobListing,
} from '../../utils/types';
import { JobTypes } from '../../utils/JobTypes';
import { PostRankerManagerService } from '../post-ranker-manager/post-ranker-manager.service';
import { InitCacheService } from '../init-cache/init-cache.service';
import { LoadNextPostsService } from '../load-next-posts/load-next-posts.service';
import { ClearCacheService } from '../clear-cache/clear-cache.service';

//job listings accepted by the JobRunner
export type AcceptedRunnerJob =
    | CacheClearJobListing
    | QueryJobListing
    | LoadJobListing
    | QueryLoadJobListing
    | InitJobListing;

@Injectable()
export class JobRunnerService {
    constructor(
        private readonly postRankerManagerService: PostRankerManagerService,
        private readonly initCacheService: InitCacheService,
        private readonly loadNextPostsService: LoadNextPostsService,
        private readonly clearCacheService: ClearCacheService,
    ) {}

    /**jobRunner
     *
     * The job runner is in charge of managing incoming jobs and ensuring they are completed correctly.
     * Jobs are read from the queue and processed below
     *
     * @param job
     */
    async jobRunner(job: AcceptedRunnerJob) {
        //init job initializes the data in the cache before a job may continue.
        //if the cache is already initialized, this job will be aborted
        //if another job attempts to process before data is initialized, it should
        //dispatch an init job and abort itself
        if (job.jobType === JobTypes.INIT) {
            const result: JobResult = await this.initCacheService.initJob(
                job as InitJobListing,
            );
            if (result === JobTypes.ABORT) return;
        }

        //Query jobs will get a large pool of data from the neo4j database and condense it down into
        //a small pool of relevant posts ranked from most to least relevant, stored in the redis cache
        if (this.doQuery(job.jobType)) {
            const result: JobResult =
                await this.postRankerManagerService.queryJob(
                    job as QueryJobListing,
                );
            if (result === JobTypes.ABORT) return;
        }

        //Load jobs will load the top posts from the pools specified and append them to the end
        //of the users timeline, and broadcast them to the system so the content service can pre-cache them
        if (this.doLoad(job.jobType)) {
            const result: JobResult = await this.loadNextPostsService.loadJob(
                job as LoadJobListing,
            );
            if (result === JobTypes.ABORT) return;
        }

        //Clear Cache jobs will clean up the cache when it is no longer needed.
        //If another job is attempted after the clear was called, it must first call an init job
        if (job.jobType === JobTypes.CLEAR_CACHE) {
            const result: JobResult =
                await this.clearCacheService.clearCacheJob(
                    job as CacheClearJobListing,
                );
            if (result === JobTypes.ABORT) return;
        }
    }

    //util to group together jobs that query for more data from neo4j
    doQuery(jobType: JobTypes) {
        return (
            jobType === JobTypes.QUERY ||
            jobType === JobTypes.QUERY_LOAD ||
            jobType === JobTypes.INIT
        );
    }

    //util to group together jobs that load more timeline data into the active timeline
    doLoad(jobType: JobTypes) {
        return (
            jobType === JobTypes.LOAD ||
            jobType === JobTypes.QUERY_LOAD ||
            jobType === JobTypes.INIT
        );
    }
}
