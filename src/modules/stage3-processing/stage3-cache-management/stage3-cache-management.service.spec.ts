import { Test, TestingModule } from '@nestjs/testing';
import { Stage3CacheManagementService } from './stage3-cache-management.service';
import { describe, expect, it } from '@jest/globals';
import {
    GET_CACHE_SIZE_KEY,
    GET_METADATA_KEY,
    GET_PER_CATEGORY_KEY,
    GET_PRE_CACHE_KEY,
    GET_PRE_CACHE_LOCK_KEY,
} from '../../../configs/cache-keys/keys';
import {
    METADATA_EXPIRE,
    PER_CATEGORY_EXPIRE,
    PRE_CACHE_POOL_EXPIRE,
} from '../../../configs/cache-expirations/expire';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';

describe('Stage3CacheManagementService', () => {
    let service: Stage3CacheManagementService;

    //test configuration data
    const USER_ID = '123321';
    const COMMUNITY_NAME = 'test-community';
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

    const clientMock = {
        multi: () => RedisMock,
    };

    //mock a single post
    const getMockedPost = (id: string, score: number) => ({
        id: id,
        sec: COMMUNITY_NAME,
        seen: false,
        vote: 0,
        score: score,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                Stage3CacheManagementService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: () => clientMock,
                    },
                },
            ],
        }).compile();

        service = module.get<Stage3CacheManagementService>(Stage3CacheManagementService);
    });

    afterEach(() => {
        RedisMock.sort.mockReset();
        RedisMock.hSetNX.mockReset();
        RedisMock.incrBy.mockReset();
        RedisMock.expire.mockReset();
        RedisMock.rPush.mockReset();
        RedisMock.get.mockReset();
        RedisMock.del.mockReset();
        RedisMock.exec.mockReset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('get the currently cached data', () => {
        const lock = {
            uniqueSignature: 'string',
            lockPath: GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
            dataPath: GET_PRE_CACHE_KEY(USER_ID, MODE),
            expAt: new Date().getTime() + 99999,
        };

        const sortCallTest = () => {
            expect(RedisMock.sort).toBeCalledWith(lock.dataPath, {
                BY: 'nosort',
                GET: ['#', `${GET_METADATA_KEY(USER_ID, '*')}->score`],
            });
        };

        it('should get the currently cached pool and associated metadata', async () => {
            await service.getCurrentPrecachePoolData(USER_ID, lock, true);

            sortCallTest();
            expect(RedisMock.get).toBeCalledWith(GET_CACHE_SIZE_KEY(USER_ID, MODE));
            expect(RedisMock.exec).toBeCalled();
        });

        it('should not get the current cachesize', async () => {
            await service.getCurrentPrecachePoolData(USER_ID, lock, false);

            sortCallTest();
            expect(RedisMock.get).not.toBeCalled();
            expect(RedisMock.exec).toBeCalled();
        });
    });

    describe('handling metadata ', () => {
        const postLookup = {
            AAAAAA: getMockedPost('AAAAAA', 10),
            BBBBBB: getMockedPost('BBBBBB', 5),
        };
        const newPosts = ['AAAAAA', 'BBBBBB'];
        const removedPosts = ['CCCCCC', 'EEEEEE'];
        //what happened to the Ds you ask?? what didnt happen to Ds ;)

        it('should set expire on all meta data added', async () => {
            await service.updatePostMetaData(newPosts, removedPosts, postLookup);

            expect(RedisMock.expire).toBeCalledTimes(newPosts.length);
            for (let i = 0; i < newPosts.length; i++) {
                expect(RedisMock.expire).toBeCalledWith(
                    GET_METADATA_KEY(USER_ID, newPosts[i]),
                    METADATA_EXPIRE,
                );
            }
        });

        it('should delete metadata for removed posts', async () => {
            await service.updatePostMetaData(newPosts, removedPosts, postLookup);
            expect(RedisMock.del).toHaveBeenCalledWith(GET_METADATA_KEY(USER_ID, removedPosts[0]));
            expect(RedisMock.del).toHaveBeenCalledWith(GET_METADATA_KEY(USER_ID, removedPosts[1]));
        });

        it('should add metadata for added posts', async () => {
            const acceptedPaths = [
                GET_METADATA_KEY(USER_ID, newPosts[0]),
                GET_METADATA_KEY(USER_ID, newPosts[1]),
            ];

            //check hSetNX is called with the correct params
            RedisMock.hSetNX.mockImplementation((path: string, key: string, value: number) => {
                expect(acceptedPaths).toContain(path);
                const index = acceptedPaths.indexOf(path);
                const post = postLookup[newPosts[index]];

                if (key === 'score') expect(value).toBe(`${post.score}`);
                else if (key === 'seen') expect(value).toBe(`${post.seen}`);
                else if (key === 'vote') expect(value).toBe(`${post.vote}`);
                else expect(`the key ${key}`).toBe('never set on the metadata');
            });

            await service.updatePostMetaData(newPosts, removedPosts, postLookup);
            expect(RedisMock.hSetNX).toHaveBeenCalled();
        });
    });

    describe('updating the cached data', () => {
        const lock = {
            uniqueSignature: 'string',
            lockPath: GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
            dataPath: GET_PRE_CACHE_KEY(USER_ID, MODE),
            expAt: new Date().getTime() + 99999,
        };

        it('should remove old pool and rPush in the new one', async () => {
            const newPool = ['a', 'b', 'c'];
            const lookup = { community1: 2, community2: -2 };
            await service.updateThePoolData(lock, newPool, lookup);

            expect(RedisMock.del).toBeCalledTimes(1);
            expect(RedisMock.del).toBeCalledWith(lock.dataPath);

            expect(RedisMock.rPush).toBeCalledTimes(1);
            expect(RedisMock.rPush).toBeCalledWith(lock.dataPath, newPool);

            expect(RedisMock.expire).toBeCalledWith(lock.dataPath, PRE_CACHE_POOL_EXPIRE);
        });

        it('should increase and decrease per-category counts for added/removed posts', async () => {
            const newPool = ['a', 'b', 'c'];
            const lookup = { community1: 2, community2: -2 };
            await service.updateThePoolData(lock, newPool, lookup);

            expect(RedisMock.incrBy).toBeCalledWith(
                GET_PER_CATEGORY_KEY(USER_ID, COMMUNITY_NAME),
                2,
            );
            expect(RedisMock.incrBy).toBeCalledWith(GET_PER_CATEGORY_KEY(USER_ID, 'community'), -2);

            expect(RedisMock.expire).toBeCalledWith(
                GET_PER_CATEGORY_KEY(USER_ID, 'community1'),
                PER_CATEGORY_EXPIRE,
            );

            expect(RedisMock.expire).toBeCalledWith(
                GET_PER_CATEGORY_KEY(USER_ID, 'community2'),
                PER_CATEGORY_EXPIRE,
            );
        });
    });
});
