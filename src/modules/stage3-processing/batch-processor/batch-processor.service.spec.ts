import { Test, TestingModule } from '@nestjs/testing';
import { BatchProcessorService } from './batch-processor.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import {
    GET_PRE_CACHE_LOCK_KEY,
    GET_PRE_CACHE_KEY,
    GET_METADATA_KEY,
    GET_CACHE_SIZE_KEY, GET_PER_CATEGORY_KEY,
} from '../../../configs/cache-keys/keys';
import { ConcurrentBatch, SortedPost } from '../../../utils/types';
import { METADATA_EXPIRE, PER_CATEGORY_EXPIRE, PRE_CACHE_POOL_EXPIRE } from '../../../configs/cache-expirations/expire';

describe('BatchProcessorService', () => {
    let service: BatchProcessorService;
    let lockService: AquireMutexService;

    //test configuration data
    const USER_ID = '123321';
    const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;

    //redis mock stuff
    const RedisMock = {
        sort: jest.fn(),
        hSetNX: jest.fn(),
        incrBy: jest.fn(),
        expire: jest.fn(),
        rPush: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        exec: jest.fn(),
    };

    const resetRedisMock = () => {
        RedisMock.sort.mockReset();
        RedisMock.hSetNX.mockReset();
        RedisMock.incrBy.mockReset();
        RedisMock.expire.mockReset();
        RedisMock.rPush.mockReset();
        RedisMock.get.mockReset();
        RedisMock.del.mockReset();
        RedisMock.exec.mockReset();
    };

    const clientMock = {
        multi: () => RedisMock,
    };

    //mock for data returned from redis
    //this function returns 5 cache values with scores from 90 to 50 decreasing by 10
    const getExecMock1 = (maxSize: number) => {
        const data = ['abcdef', 90, 'bcdefa', 80, 'cdefab', 70, 'defabc', 60, 'efabcd', 50];
        if (maxSize <= 0) return data;
        data.push(maxSize);
        return data;
    };

    //mock a single post
    const getMockedPost = (score: number) => ({
        id: `ffffff`,
        sec: 'sec',
        seen: false,
        vote: 0,
        score: score,
    });

    //mocking concurrent batches
    const genMockedBatch = async (
        size: number,
        scoreStart = 0,
        sec = 'category',
    ): ConcurrentBatch => {
        const batch: SortedPost[] = [];
        for (let i = 0; i < size; i++) {
            batch.push({
                id: `${i}`,
                sec: sec,
                seen: false,
                vote: 0,
                score: scoreStart + i,
            });
        }
        return batch;
    };

    //mocking concurrent batches with a specific post(s) as it must be a promise
    const sortedPostsToBatch = async (posts: SortedPost[]): ConcurrentBatch => {
        return posts;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchProcessorService,
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
            ],
        }).compile();

        service = module.get<BatchProcessorService>(BatchProcessorService);
        lockService = module.get<AquireMutexService>(AquireMutexService);

        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        acquireLockSpy.mockImplementation(
            (lockPath: string, dataPath: string): Promise<AquiredLock> => {
                return new Promise((resolve) => {
                    resolve({
                        dataPath: dataPath,
                        lockPath: lockPath,
                        uniqueSignature: 'ASDASD',
                        expAt: new Date().getTime() + 999999,
                    });
                });
            },
        );

        //first exec returns cached data
        RedisMock.exec.mockResolvedValueOnce(getExecMock1(10));
        //second exec returns status codes of hSetNX
        RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);
    });

    afterEach(() => {
        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');

        acquireLockSpy.mockReset();
        releaseLockSpy.mockReset();
        resetRedisMock();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('get a lock on the pre-cache', () => {
        it('should get a lock on the cache pool', async () => {
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');

            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            expect(acquireLockSpy).toBeCalledWith(
                GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
                GET_PRE_CACHE_KEY(USER_ID, MODE),
            );
        });
    });
    describe('get the currently cached data', () => {
        it('should get the currently cached pool and associated metadata', async () => {
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            expect(RedisMock.sort).toBeCalledWith(GET_PRE_CACHE_KEY(USER_ID, MODE), {
                BY: 'nosort',
                GET: ['#', `${GET_METADATA_KEY(USER_ID, '*')}->score`],
            });
        });
        it('should get the current cachesize, if it is not specified by the job', async () => {
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            expect(RedisMock.get).toBeCalledWith(GET_CACHE_SIZE_KEY(USER_ID, MODE));
        });
        it('should not get the current cachesize, if it is specified by the job', async () => {
            //setup test space
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(-1));
            RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);

            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)], 5);

            expect(RedisMock.get).not.toBeCalledWith(GET_CACHE_SIZE_KEY(USER_ID, MODE));
        });
    });
    describe('insert the processed batches in order of most relevant', () => {
        it('should add posts to the end of the cache if they are lower than the current posts', async () => {
            const post = getMockedPost(49);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                const len = data.length;
                //should be in last position
                expect(data[len - 1]).toBe(post.id);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
        it('should insert posts in between higher and lower ranked posts', async () => {
            const post = getMockedPost(51);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                const len = data.length;
                //should be 2nd position from right
                expect(data[len - 2]).toBe(post.id);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
        it('should insert identical posts at the end of same ranked posts', async () => {
            const post = getMockedPost(60);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                const len = data.length;
                //should be 2nd position from right
                expect(data[len - 2]).toBe(post.id);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
        it('should not have a cache too large if it was full but an element was inserted', async () => {
            const MAX_SIZE = 5;
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(MAX_SIZE));
            RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);

            const post = getMockedPost(100);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                const len = data.length;
                //cache was full and this post was inserted at the start
                expect(data[0]).toBe(post.id);
                expect(len).toBe(MAX_SIZE);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
        it('should not process posts ranked lower than the lowest score in a full cache', async () => {
            const MAX_SIZE = 5;
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(MAX_SIZE));
            RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);

            const post = getMockedPost(49);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                const len = data.length;
                //cache was full and this post was ranked lower
                expect(data).not.toContain(post.id);
                expect(len).toBe(MAX_SIZE);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
    });
    describe('handling metadata ', () => {
        it('should add metadata for added posts', async () => {
            const post = getMockedPost(60);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies
            RedisMock.hSetNX.mockImplementation((path: string, key: string, value: number) => {
                expect(path).toBe(GET_METADATA_KEY(USER_ID, post.id));
                if (key === 'score') expect(value).toBe(post.score);
                if (key === 'seen') expect(value).toBe(post.seen);
                if (key === 'vote') expect(value).toBe(post.vote);
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.hSetNX).toHaveBeenCalled();
        });
        it('should not add metadata for un-added posts', async () => {
            const MAX_SIZE = 5;
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(MAX_SIZE));
            RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);

            const post = getMockedPost(49);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.hSetNX).not.toHaveBeenCalled();
        });
        it('should delete metadata for removed posts that existed before re-ordering', async () => {
            const MAX_SIZE = 5;
            const rawData = getExecMock1(MAX_SIZE);
            const LAST_ID = rawData[rawData.length - 2] as string;
            RedisMock.exec.mockReset().mockResolvedValueOnce(rawData);
            RedisMock.exec.mockResolvedValueOnce([1, 1, 1]);

            const post = getMockedPost(100);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.del).toHaveBeenCalledWith(GET_METADATA_KEY(USER_ID, LAST_ID));
        });
        it('should remove posts from the pool where metadata was added by another process', async () => {
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(10));
            RedisMock.exec.mockResolvedValueOnce([0, 0, 0]); //hSetNX indicates another process added this

            const post = getMockedPost(60);
            const mockedBatchPost = sortedPostsToBatch([post]);

            //setup spies - hSetNX should be called to attempt to insert post,
            // but indicates not to, so rPush should not contain this post

            //- key and value unused for this test but required for mock
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            RedisMock.hSetNX.mockImplementation((path: string, key: string, value: number) => {
                expect(path).toBe(GET_METADATA_KEY(USER_ID, post.id));
            });
            RedisMock.rPush.mockImplementation((path: string, data: string[]) => {
                //cache was full and this post was ranked lower
                expect(data).not.toContain(post.id);
                expect(path).toBe(GET_PRE_CACHE_KEY(USER_ID, MODE));
            });

            //run test
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);
            expect(RedisMock.hSetNX).toHaveBeenCalled();
            expect(RedisMock.rPush).toHaveBeenCalled();
        });
    });
    describe('updating the cached data', () => {
        it('should increase and decrease per-category counts for added/removed posts', async () => {
            //the cache is full
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(5));
            RedisMock.exec.mockResolvedValueOnce([1,1,1, 1,1,1]);

            //2 posts to add (community: sec)
            const post1 = getMockedPost(60);
            const post2 = getMockedPost(80);
            const mockedBatchPost = sortedPostsToBatch([post1, post2]);

            //will remove 2 existing posts (community: category)
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);

            expect(RedisMock.incrBy).toBeCalledWith(GET_PER_CATEGORY_KEY(USER_ID, "sec"), 2);
            expect(RedisMock.incrBy).toBeCalledWith(GET_PER_CATEGORY_KEY(USER_ID, "community"), -2);
        });
        it('should not update per-category counts for posts staged to be added but then cancelled during metadata check', async () => {
            //the posts were unstaged dur to hSetNX
            RedisMock.exec.mockReset().mockResolvedValueOnce(getExecMock1(10));
            RedisMock.exec.mockResolvedValueOnce([0,0,0, 0,0,0]);

            //2 posts to add (community: sec)
            const post1 = getMockedPost(60);
            const post2 = getMockedPost(80);
            const mockedBatchPost = sortedPostsToBatch([post1, post2]);

            //will remove 2 existing posts (community: category)
            await service.processBatches(USER_ID, MODE, [mockedBatchPost]);

            expect(RedisMock.incrBy).not.toBeCalledWith(GET_PER_CATEGORY_KEY(USER_ID, "sec"), 2);
        });
    });
    describe('expiring of cache keys', () => {
        it('should set expire on the cache-pool list', async () => {
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);
            expect(RedisMock.expire).toBeCalledWith(GET_PRE_CACHE_KEY(USER_ID, MODE), PRE_CACHE_POOL_EXPIRE);
        });
        it('should set expire on all meta data added', async () => {
            const batch = genMockedBatch(3);
            await service.processBatches(USER_ID, MODE, [batch]);

            const processedBatch = await batch;
            for(let i = 0; i < processedBatch.length; i++)
                expect(RedisMock.expire).toBeCalledWith(GET_METADATA_KEY(USER_ID, processedBatch[i].id), METADATA_EXPIRE);
        });
        it('should set expire on all updated per-category', async () => {
            const batch = genMockedBatch(3);
            await service.processBatches(USER_ID, MODE, [batch]);

            const section = (await batch)[0].sec;
            expect(RedisMock.expire).toBeCalledWith(GET_PER_CATEGORY_KEY(USER_ID, section), PER_CATEGORY_EXPIRE);
        });
    });
    describe('remove the lock', () => {
        it('should remove the lock on the cache pool', async () => {
            const lock = {
                dataPath: GET_PRE_CACHE_KEY(USER_ID, MODE),
                lockPath: GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
                uniqueSignature: 'ASDASD',
                expAt: new Date().getTime() + 999999,
            };
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
            acquireLockSpy.mockReset().mockResolvedValue(lock)
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            expect(releaseLockSpy).toBeCalledWith(lock);
        });
        it('should abort before writing metadata changes if the lock on the cache pool will expire in the next configured seconds', async () => {
            //the lock must still be active for a configured buffer time. batch 1 handles the
            // metadata, then there is some small processing before batch 2 is dispatched.
            // we must ensure that the lock will hold for long enough to run both of these operations
            const lock = {
                dataPath: GET_PRE_CACHE_KEY(USER_ID, MODE),
                lockPath: GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
                uniqueSignature: 'ASDASD',
                expAt: new Date().getTime() - 10,
            };
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
            acquireLockSpy.mockReset().mockResolvedValue(lock)
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            //expect it to call the initial get data then "when" the lock expires, it should
            // abort and not write any data with exec
            expect(RedisMock.exec).toBeCalledTimes(1);
        });
    });
});
