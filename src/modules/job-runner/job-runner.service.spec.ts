import {Test, TestingModule} from '@nestjs/testing';
import {JobRunnerService} from './job-runner.service';
import {beforeEach, describe, expect, it} from '@jest/globals';
import {JobTypes} from '../../utils/JobTypes';
import {
    CacheClearJobListing,
    InitJobListing,
    LoadJobListing,
    QueryJobListing,
    QueryLoadJobListing
} from "../../utils/types";
import {DiscoveryModes} from "../../utils/DiscoveryModes";
import {InitCacheService} from "../init-cache/init-cache.service";
import {PostRankerManagerService} from "../post-ranker-manager/post-ranker-manager.service";
import {LoadNextPostsService} from "../load-next-posts/load-next-posts.service";
import {ClearCacheService} from "../clear-cache/clear-cache.service";

describe('JobRunnerService', () => {
    let service: JobRunnerService;
    let initCacheService: InitCacheService;
    let postRankerManagerService: PostRankerManagerService;
    let loadNextPostsService: LoadNextPostsService;
    let clearCacheService: ClearCacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobRunnerService,
                {
                    provide: InitCacheService,
                    useValue: {
                        initJob: jest.fn(),
                    },
                },
                {
                    provide: PostRankerManagerService,
                    useValue: {
                        queryJob: jest.fn(),
                    },
                },
                {
                    provide: LoadNextPostsService,
                    useValue: {
                        loadJob: jest.fn(),
                    },
                },
                {
                    provide: ClearCacheService,
                    useValue: {
                        clearCacheJob: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<JobRunnerService>(JobRunnerService);
        initCacheService = module.get<InitCacheService>(InitCacheService);
        postRankerManagerService = module.get<PostRankerManagerService>(PostRankerManagerService);
        loadNextPostsService = module.get<LoadNextPostsService>(LoadNextPostsService);
        clearCacheService = module.get<ClearCacheService>(ClearCacheService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    //NOTE TO DEVELOPER::::::::::::::::::::
    //
    //  If the JobRunner is updated, you should ensure any
    //  new cases are checked against the FAIL_IF_CALLED
    //  util for all the existing test cases written below
    //
    //
    //
    //

    describe('jobRunner', () => {
        //no-call checker util
        const FAIL_IF_CALLED = async (a) => {
            expect("this function").toBe("never called");
            return JobTypes.ABORT
        };

        //util gets the order that this function was called in (greater the number returned, the later
        //it was called). it is used to ensure one function is called after another.
        //I could have used jest-extended but i didnt want to install a whole package
        //just to run this test that I can do without it anyway
        const getInvocationOrder = (s: { mock: { invocationCallOrder: number[] } }): number => {
            return s.mock.invocationCallOrder[0];
        };

        it('should call init, query and load, in that order, for a successful init job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockResolvedValue(JobTypes.CONTINUE);
            queryJobMock.mockResolvedValue(JobTypes.CONTINUE);
            loadJobMock.mockResolvedValue(JobTypes.CONTINUE);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: InitJobListing = {
                jobType: JobTypes.INIT,
                jobid: "jid",
                userid: "uid",
                query: 1,
                publish: 1,
                cache: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(initJobMock).toBeCalled();
            //check query called after init
            expect(getInvocationOrder(queryJobMock)).toBeGreaterThan(getInvocationOrder(initJobMock));
            //check load was called after query
            expect(getInvocationOrder(loadJobMock)).toBeGreaterThan(getInvocationOrder(queryJobMock));
        });

        it('should call only init for an aborted init job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockResolvedValue(JobTypes.ABORT);
            queryJobMock.mockImplementation(FAIL_IF_CALLED);
            loadJobMock.mockImplementation(FAIL_IF_CALLED);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: InitJobListing = {
                jobType: JobTypes.INIT,
                jobid: "jid",
                userid: "uid",
                query: 1,
                publish: 1,
                cache: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(initJobMock).toBeCalled();
        });

        it('should call query and load, in that order, for a query and load job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockImplementation(FAIL_IF_CALLED);
            queryJobMock.mockResolvedValue(JobTypes.CONTINUE);
            loadJobMock.mockResolvedValue(JobTypes.CONTINUE);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: QueryLoadJobListing = {
                jobType: JobTypes.QUERY_LOAD,
                jobid: "jid",
                userid: "uid",
                query: 1,
                publish: 1,
                cache: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(queryJobMock).toBeCalled();
            //check load was called after query
            expect(getInvocationOrder(loadJobMock)).toBeGreaterThan(getInvocationOrder(queryJobMock));

        });

        it('should call only query for an aborted query and load job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockImplementation(FAIL_IF_CALLED);
            queryJobMock.mockResolvedValue(JobTypes.ABORT);
            loadJobMock.mockImplementation(FAIL_IF_CALLED);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: QueryLoadJobListing = {
                jobType: JobTypes.QUERY_LOAD,
                jobid: "jid",
                userid: "uid",
                query: 1,
                publish: 1,
                cache: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(queryJobMock).toBeCalled();
        });

        it('should call only query for a query job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockImplementation(FAIL_IF_CALLED);
            queryJobMock.mockResolvedValue(JobTypes.CONTINUE);
            loadJobMock.mockImplementation(FAIL_IF_CALLED);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: QueryJobListing = {
                jobType: JobTypes.QUERY,
                jobid: "jid",
                userid: "uid",
                query: 1,
                cache: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(queryJobMock).toBeCalled();
        });

        it('should call only load for a load job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockImplementation(FAIL_IF_CALLED);
            queryJobMock.mockImplementation(FAIL_IF_CALLED);
            loadJobMock.mockResolvedValue(JobTypes.CONTINUE);
            clearCacheJobMock.mockImplementation(FAIL_IF_CALLED);

            //the only data that jobRunner cares about it jobType
            const job: LoadJobListing = {
                jobType: JobTypes.LOAD,
                jobid: "jid",
                userid: "uid",
                publish: 1,
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION],
            };

            await service.jobRunner(job);

            expect(loadJobMock).toBeCalled();
        });

        it('should call only clear cache for a clear cache job', async () => {
            const initJobMock = jest.spyOn(initCacheService, 'initJob');
            const queryJobMock = jest.spyOn(postRankerManagerService, 'queryJob');
            const loadJobMock = jest.spyOn(loadNextPostsService, 'loadJob');
            const clearCacheJobMock = jest.spyOn(clearCacheService, 'clearCacheJob');

            initJobMock.mockImplementation(FAIL_IF_CALLED);
            queryJobMock.mockImplementation(FAIL_IF_CALLED);
            loadJobMock.mockImplementation(FAIL_IF_CALLED);
            clearCacheJobMock.mockResolvedValue(JobTypes.CONTINUE);

            //the only data that jobRunner cares about it jobType
            const job: CacheClearJobListing = {
                jobType: JobTypes.CLEAR_CACHE,
                jobid: "jid",
                userid: "uid",
            };

            await service.jobRunner(job);

            expect(clearCacheJobMock).toBeCalled();
        });
    });

    describe('doQuery', () => {
        it('should return true for job types QUERY, QUERY_LOAD and INIT', () => {
            const QUERY = service.doQuery(JobTypes.QUERY);
            const QUERY_LOAD = service.doQuery(JobTypes.QUERY_LOAD);
            const INIT = service.doQuery(JobTypes.INIT);

            expect(QUERY).toBe(true);
            expect(QUERY_LOAD).toBe(true);
            expect(INIT).toBe(true);
        });

        it('should return false for job types that are not QUERY, QUERY_LOAD and INIT', () => {
            const WRITE = service.doQuery(JobTypes.WRITE);
            const CONTINUE = service.doQuery(JobTypes.CONTINUE);
            const ABORT = service.doQuery(JobTypes.ABORT);
            const CLEAR_CACHE = service.doQuery(JobTypes.CLEAR_CACHE);
            const LOAD = service.doQuery(JobTypes.LOAD);

            expect(WRITE).toBe(false);
            expect(CONTINUE).toBe(false);
            expect(ABORT).toBe(false);
            expect(CLEAR_CACHE).toBe(false);
            expect(LOAD).toBe(false);
        });
    });

    describe('doLoad', () => {
        it('should return true for job types QUERY, QUERY_LOAD and INIT', () => {
            const LOAD = service.doLoad(JobTypes.LOAD);
            const QUERY_LOAD = service.doLoad(JobTypes.QUERY_LOAD);
            const INIT = service.doLoad(JobTypes.INIT);

            expect(LOAD).toBe(true);
            expect(QUERY_LOAD).toBe(true);
            expect(INIT).toBe(true);
        });

        it('should return false for job types that are not QUERY, QUERY_LOAD and INIT', () => {
            const WRITE = service.doLoad(JobTypes.WRITE);
            const CONTINUE = service.doLoad(JobTypes.CONTINUE);
            const ABORT = service.doLoad(JobTypes.ABORT);
            const CLEAR_CACHE = service.doLoad(JobTypes.CLEAR_CACHE);
            const QUERY = service.doLoad(JobTypes.QUERY);

            expect(WRITE).toBe(false);
            expect(CONTINUE).toBe(false);
            expect(ABORT).toBe(false);
            expect(CLEAR_CACHE).toBe(false);
            expect(QUERY).toBe(false);
        });
    });
});
