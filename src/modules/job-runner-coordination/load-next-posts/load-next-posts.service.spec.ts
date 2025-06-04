import { Test, TestingModule } from '@nestjs/testing';
import { LoadNextPostsService } from './load-next-posts.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { BroadcastCachePostsService } from '../../queue-management/broadcasters/broadcast-cache-posts/broadcast-cache-posts.service';
import { LoadJobListing, QueryLoadJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import {
    GET_FINAL_POOL_KEY,
    GET_PRE_CACHE_KEY,
    GET_PRE_CACHE_LOCK_KEY,
} from '../../../configs/cache-keys/keys';
import { defaults as PUBLISH_WEIGHTS } from '../../../configs/load-more-posts/publish-weightings';
import { BroadcastNewJobService } from '../../queue-management/broadcasters/broadcast-new-job/broadcast-new-job.service';
import { FINAL_POOL_EXPIRE, PRE_CACHE_POOL_EXPIRE } from '../../../configs/cache-expirations/expire';

describe('LoadNextPostsService', () => {
    let service: LoadNextPostsService;
    let lockService: AquireMutexService;
    let broadcastCachePostsService: BroadcastCachePostsService;
    let broadcastNewJobService: BroadcastNewJobService;

    const RedisMock = {
        lMove: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn(),
    };

    const clientMock = {
        multi: () => RedisMock,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoadNextPostsService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: () => clientMock,
                    },
                },
                {
                    provide: AquireMutexService,
                    useValue: {
                        aquireLock: () => jest.fn(),
                        releaseLock: () => jest.fn(),
                    },
                },
                {
                    provide: BroadcastCachePostsService,
                    useValue: {
                        broadcastPosts: () => jest.fn(),
                    },
                },
                {
                    provide: BroadcastNewJobService,
                    useValue: {
                        broadcastJob: () => jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LoadNextPostsService>(LoadNextPostsService);
        lockService = module.get<AquireMutexService>(AquireMutexService);
        broadcastCachePostsService = module.get<BroadcastCachePostsService>(
            BroadcastCachePostsService,
        );
        broadcastNewJobService = module.get<BroadcastNewJobService>(BroadcastNewJobService);

        RedisMock.exec.mockResolvedValue(["123321"]);
    });

    afterEach(() => {
        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');

        acquireLockSpy.mockReset();
        releaseLockSpy.mockReset();
        RedisMock.lMove.mockReset();
        RedisMock.expire.mockReset();
        RedisMock.exec.mockReset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    function acquireLockResolveOnce(mode: DiscoveryModes, userId: string, expire = 10000) {
        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        const lock = {
            dataPath: GET_PRE_CACHE_KEY(userId, mode),
            lockPath: GET_PRE_CACHE_LOCK_KEY(userId, mode),
            uniqueSignature: 'ASDASD',
            expAt: new Date().getTime() + expire,
        };
        acquireLockSpy.mockResolvedValueOnce(lock);
        return lock;
    }

    function getJob(modes: DiscoveryModes[], userId: string, publish = 10): LoadJobListing {
        return {
            userid: userId,
            jobid: 'fedcba',
            jobType: JobTypes.LOAD,
            publish: publish,
            modes: modes,
        };
    }

    function sumWeights(MODES: DiscoveryModes[]): number {
        let sum = 0;
        for (let i = 0; i < MODES.length; i++) sum += PUBLISH_WEIGHTS[MODES[i]];
        return sum;
    }

    describe('updates expiration times', () => {
        it('should update the expiration times on all pools including the final pool', async () => {
            //setup test data
            const MODES = [
                DiscoveryModes.FOLLOWED_SUBSECTION,
                DiscoveryModes.RECOMMENDED_SUBSECTION,
                DiscoveryModes.FOLLOWED_USER,
                DiscoveryModes.RECOMMENDED_USER,
            ];
            const userId = 'abcdef';
            const job = getJob(MODES, userId);

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(RedisMock.expire).toBeCalledTimes(MODES.length + 1);
            expect(RedisMock.expire).toBeCalledWith(
                GET_FINAL_POOL_KEY(userId),
                FINAL_POOL_EXPIRE,
            );
            for (let i = 0; i < MODES.length; i++){
                expect(RedisMock.expire).toBeCalledWith(
                    GET_PRE_CACHE_KEY(userId, MODES[i]),
                    PRE_CACHE_POOL_EXPIRE,
                );
            }
        });

    });

    describe('locks are aquired and released', () => {
        it('should get a lock on a pre-cache pool', async () => {
            //setup test data
            const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;
            const userId = 'abcdef';
            const job = getJob([MODE], userId);

            //setup spies
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);
            acquireLockResolveOnce(job.modes[0], userId);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(acquireLockSpy).toBeCalledWith(
                GET_PRE_CACHE_LOCK_KEY(userId, MODE),
                GET_PRE_CACHE_KEY(userId, MODE),
            );
        });

        it('should get a lock on all specified pools', async () => {
            //setup test data
            const MODES = [
                DiscoveryModes.FOLLOWED_SUBSECTION,
                DiscoveryModes.RECOMMENDED_SUBSECTION,
                DiscoveryModes.FOLLOWED_USER,
                DiscoveryModes.RECOMMENDED_USER,
            ];
            const userId = 'abcdef';
            const job = getJob(MODES, userId);

            //setup spies
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            for (let i = 0; i < MODES.length; i++)
                expect(acquireLockSpy).toBeCalledWith(
                    GET_PRE_CACHE_LOCK_KEY(userId, MODES[i]),
                    GET_PRE_CACHE_KEY(userId, MODES[i]),
                );
        });

        it('should remove a lock', async () => {
            //setup test data
            const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;
            const userId = 'abcdef';
            const job = getJob([MODE], userId);

            //setup spies
            const lock = acquireLockResolveOnce(job.modes[0], userId);
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(releaseLockSpy).toHaveBeenCalledWith(lock);
        });

        it('should remove locks on all pools', async () => {
            //setup test data
            const MODES = [
                DiscoveryModes.FOLLOWED_SUBSECTION,
                DiscoveryModes.RECOMMENDED_SUBSECTION,
                DiscoveryModes.FOLLOWED_USER,
                DiscoveryModes.RECOMMENDED_USER,
            ];
            const userId = 'abcdef';
            const job = getJob(MODES, userId);
            const locks: AquiredLock[] = [];

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);
            for (let i = 0; i < MODES.length; i++)
                locks.push(acquireLockResolveOnce(job.modes[i], userId));

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            for (let i = 0; i < MODES.length; i++) expect(releaseLockSpy).toBeCalledWith(locks[i]);
        });

        it('should abort if lock expires', async () => {
            //setup test data
            const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;
            const userId = 'abcdef';
            const job = getJob([MODE], userId);

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(false);
            acquireLockResolveOnce(job.modes[0], userId, -10000);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.ABORT);
            expect(releaseLockSpy).toHaveBeenCalled();
            expect(RedisMock.exec).not.toHaveBeenCalled();
        });
    });

    describe('broadcasting appropriately', () => {
        it('should broadcast the published post IDs to the queue, excluding nulls', async () => {
            //setup test data
            const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;
            const PUBLISH = 6;
            const userId = 'abcdef';
            const job = getJob([MODE], userId, PUBLISH);
            const publishedPosts: (string | null)[] = [
                'aaaaaa',
                'bbbbbb',
                'cccccc',
                'dddddd',
                'eeeeee',
                null,
            ];

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            const broadcastSpy = jest.spyOn(broadcastCachePostsService, 'broadcastPosts');
            releaseLockSpy.mockResolvedValue(true);
            RedisMock.exec.mockResolvedValue(publishedPosts);
            acquireLockResolveOnce(job.modes[0], userId);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(broadcastSpy).toHaveBeenCalledWith(publishedPosts.slice(0, -1));
        });

        it('should broadcast a single QueryLoad job for all empty auto-renew DiscoveryModes', async () => {
            //setup test data
            const MODES = [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER];
            const PUBLISH = 6;
            const userId = 'abcdef';
            const job = getJob(MODES, userId, PUBLISH);
            const publishedPosts: (string | null)[] = [null, null, null, null, null, null];

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            const broadcastSpy = jest.spyOn(broadcastNewJobService, 'broadcastJob');
            releaseLockSpy.mockResolvedValue(true);
            RedisMock.exec.mockResolvedValue(publishedPosts);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            //ensure the generated broadcast job contains all MODES
            broadcastSpy.mockImplementation(async (generatedJob: QueryLoadJobListing) => {
                for (let i = 0; i < MODES.length; i++)
                    expect(generatedJob.modes).toContain(MODES[i]);
                    expect(generatedJob.publish).toBe(publishedPosts.length);
            });

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(broadcastSpy).toHaveBeenCalledTimes(1);
        });

        it('should broadcast a single QueryLoad job for a single empty auto-renew DiscoveryModes', async () => {
            //setup test data
            const MODES = [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER];
            const PUBLISH = 2;
            const userId = 'abcdef';
            const job = getJob(MODES, userId, PUBLISH);
            const publishedPosts: (string | null)[] = ['aaaaaa', null];

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            const broadcastSpy = jest.spyOn(broadcastNewJobService, 'broadcastJob');
            releaseLockSpy.mockResolvedValue(true);
            RedisMock.exec.mockResolvedValue(publishedPosts);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            //ensure the generated broadcast job contains the correct mode
            broadcastSpy.mockImplementation(async (generatedJob: QueryLoadJobListing) => {
                expect(generatedJob.modes).toContain(DiscoveryModes.FOLLOWED_USER);
                expect(generatedJob.modes.length).toBe(1);
                expect(generatedJob.publish).toBe(1);
            });

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(broadcastSpy).toHaveBeenCalledTimes(1);
        });

        it('should not broadcast a QueryLoad job if no DiscoveryModes are empty', async () => {
            //setup test data
            const MODES = [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER];
            const PUBLISH = 3;
            const userId = 'abcdef';
            const job = getJob(MODES, userId, PUBLISH);
            const publishedPosts: (string | null)[] = ['aaaaaa', 'bbbbbb', 'cccccc'];

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            const broadcastSpy = jest.spyOn(broadcastNewJobService, 'broadcastJob');
            releaseLockSpy.mockResolvedValue(true);
            RedisMock.exec.mockResolvedValue(publishedPosts);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(broadcastSpy).not.toHaveBeenCalled();
        });
    });

    describe('publishing the correct number of posts', () => {
        it('should get a move "publish" qty posts from the pre-cache pool to the final pool', async () => {
            //setup test data
            const PUBLISH = 10;
            const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;
            const userId = 'abcdef';
            const job = getJob([MODE], userId, PUBLISH);

            //setup spies
            const lock = acquireLockResolveOnce(job.modes[0], userId);
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            expect(RedisMock.lMove).toHaveBeenCalledTimes(PUBLISH);
            expect(RedisMock.lMove).toHaveBeenCalledWith(
                lock.dataPath,
                GET_FINAL_POOL_KEY(userId),
                'LEFT',
                'RIGHT',
            );
        });

        it('should take from each pool a qty based on configured weights (multiplier=1; MODES=4)', async () => {
            await runPublishQtyWeightingTest(
                [
                    DiscoveryModes.FOLLOWED_SUBSECTION,
                    DiscoveryModes.RECOMMENDED_SUBSECTION,
                    DiscoveryModes.FOLLOWED_USER,
                    DiscoveryModes.RECOMMENDED_USER,
                ],
                1,
            );
        });
        it('should take from each pool a qty based on configured weights (multiplier=5; MODES=4)', async () => {
            await runPublishQtyWeightingTest(
                [
                    DiscoveryModes.FOLLOWED_SUBSECTION,
                    DiscoveryModes.RECOMMENDED_SUBSECTION,
                    DiscoveryModes.FOLLOWED_USER,
                    DiscoveryModes.RECOMMENDED_USER,
                ],
                5,
            );
        });
        it('should take from each pool a qty based on configured weights (multiplier=1; MODES=2)', async () => {
            await runPublishQtyWeightingTest(
                [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER],
                1,
            );
        });
        it('should take from each pool a qty based on configured weights (multiplier=1; MODES=3)', async () => {
            await runPublishQtyWeightingTest(
                [
                    DiscoveryModes.FOLLOWED_SUBSECTION,
                    DiscoveryModes.FOLLOWED_USER,
                    DiscoveryModes.RECOMMENDED_USER,
                ],
                1,
            );
        });

        async function runPublishQtyWeightingTest(MODES: DiscoveryModes[], MULTIPLIER = 1) {
            //setup test data
            const userId = 'abcdef';
            const moveSourceParams: { [key: string]: number } = {};
            //the total to publish is equal to a multiple of the sum of all weights. This ensures that
            //the total published posts of each mode will be equal to a multiple of its weight and not
            //a rounded decimal value
            const PUBLISH = sumWeights(MODES) * MULTIPLIER;
            const job = getJob(MODES, userId, PUBLISH);

            //setup spies
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            releaseLockSpy.mockResolvedValue(true);
            for (let i = 0; i < MODES.length; i++) acquireLockResolveOnce(job.modes[i], userId);

            RedisMock.lMove.mockImplementation((source, dest, left, right) => {
                expect(left).toBe('LEFT');
                expect(right).toBe('RIGHT');
                expect(dest).toBe(GET_FINAL_POOL_KEY(userId));

                if (moveSourceParams[source]) moveSourceParams[source]++;
                else moveSourceParams[source] = 1;
            });

            //run test
            const out = await service.loadJob(job);

            //evaluate test
            expect(out).toBe(JobTypes.CONTINUE);
            //ensure each mode has the correct number of published posts
            for (let i = 0; i < MODES.length; i++)
                expect(moveSourceParams[GET_PRE_CACHE_KEY(userId, MODES[i])]).toBe(
                    PUBLISH_WEIGHTS[MODES[i]] * MULTIPLIER,
                );
        }
    });
});
