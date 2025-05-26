import { Test, TestingModule } from '@nestjs/testing';
import { Stage2CacheManagementService } from './stage2-cache-management.service';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import getRawPostObjectSpecUtil from '../../../utils/getRawPostObject.spec.util';
import { RawPost } from '../../../utils/types';
import { LookupData, LookupEnum, Stage2CacheData } from '../CacheEnumsAndTypes';
import { GET_METADATA_KEY, GET_PER_CATEGORY_KEY, GET_SESSION_KEY } from '../../../configs/cache-keys/keys';

describe('Stage2CacheManagementService', () => {
    let service: Stage2CacheManagementService;
    let cache: RedisCacheDriverService;

    const multiMock = {
        get: jest.fn(),
        hGet: jest.fn(),
        exec: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                Stage2CacheManagementService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<Stage2CacheManagementService>(Stage2CacheManagementService);
        cache = module.get<RedisCacheDriverService>(RedisCacheDriverService);

        jest.spyOn(cache, 'getClient').mockResolvedValue({
            // @ts-expect-error - mocked data is only mocking required functions and irrelevant ones are un mocked
            multi: () => multiMock,
        });

        multiMock.exec.mockResolvedValue(['sess', '1', '1']);
    });

    afterEach(() => {
        multiMock.get.mockReset();
        multiMock.hGet.mockReset();
        multiMock.exec.mockReset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('building the query data', () => {
        it('should get the session ID first', async () => {
            //initialize test data
            const userId = '123';

            //create mocks
            const getMock = jest.spyOn(multiMock, 'get');

            //run test
            await service.getCachedData(userId, [getRawPostObjectSpecUtil(0, 'community')]);

            //first get call should be for the session id
            expect(getMock).toHaveBeenNthCalledWith(1, GET_SESSION_KEY(userId));
        });

        it('should get the total seen posts for each community in this batch and add them to the lookup', async () => {
            //initialize test data
            const userId = '123';
            const postId = 0;
            const community = `community_${postId}`;
            const rawPosts: RawPost[] = [getRawPostObjectSpecUtil(postId, community)];

            //create mocks
            const getMock = jest.spyOn(multiMock, 'get');
            //first push should be the post
            jest.spyOn(Array.prototype, 'push').mockImplementationOnce(() => 0);
            //second push should be community
            jest.spyOn(Array.prototype, 'push').mockImplementationOnce((data: LookupData) => {
                //ensures that the correct data was pushed to the lookup array
                expect(data.type).toBe(LookupEnum.COMMUNITY_SEEN_COUNT);
                expect(data.value).toBe(community);
                return 0;
            });

            //run test
            await service.getCachedData(userId, rawPosts);

            //second get call should be for the percategory total
            expect(getMock).toHaveBeenNthCalledWith(
                2,
                GET_PER_CATEGORY_KEY(userId, community),
            );
        });

        it('should only get a community once if it appears multiple times in the batch and only add once to the lookup', async () => {
            //initialize test data
            const userId = '123';
            const postId = 0;
            const community = `community_name`;
            const rawPosts: RawPost[] = [
                getRawPostObjectSpecUtil(postId, community),
                getRawPostObjectSpecUtil(postId + 1, community),
            ];

            //create mocks
            const getMock = jest.spyOn(multiMock, 'get');
            multiMock.exec.mockResolvedValue(['sess', '1', '1', '2']);

            //run test
            await service.getCachedData(userId, rawPosts);

            //should be called twice, once to get the ID, and only once for the community
            expect(getMock).toHaveBeenCalledTimes(2);
        });

        it('should hGet to check if each post already exists in the meta data and add them to the lookup', async () => {
            //initialize test data
            const userId = '123';
            const postId = 0;
            const generatedPostId = `MOCK${postId}`;
            const community = `community_${postId}`;
            const rawPosts: RawPost[] = [getRawPostObjectSpecUtil(postId, community)];

            //create mocks
            const hGetMock = jest.spyOn(multiMock, 'hGet');

            //first push is what we are interested in (post push)
            jest.spyOn(Array.prototype, 'push').mockImplementationOnce((data: LookupData) => {
                //ensures that the correct data was pushed to the lookup array
                expect(data.type).toBe(LookupEnum.POST);
                expect(data.value).toBe(generatedPostId);
                return 0;
            });
            //second push should be community
            jest.spyOn(Array.prototype, 'push').mockImplementationOnce(() => 0);

            //run test
            await service.getCachedData(userId, rawPosts);

            //second get call should be for the percategory total
            expect(hGetMock).toHaveBeenNthCalledWith(
                1,
                GET_METADATA_KEY(userId, generatedPostId),
                'score',
            );
        });
    });

    describe('parsing the data', () => {
        //initialize test data
        const userId = '123';
        const postId = 0;
        const community1 = 'community1';
        const community2 = 'community2';
        const rawPosts: RawPost[] = [
            getRawPostObjectSpecUtil(postId, community1),
            getRawPostObjectSpecUtil(postId + 1, community2),
        ];

        beforeEach(() => {
            //session ID, community seen count, cached post score, community seen count, cached post score
            multiMock.exec.mockResolvedValue(['sessid', '10', '3', null, null]);
        });

        it('should set the session ID in the output data', async () => {
            //run test
            const output: Stage2CacheData = await service.getCachedData(userId, rawPosts);

            //session id should be set
            expect(output.sessId).toBe('sessid');
        });

        it('should add community counts to the output data as an integer', async () => {
            //run test
            const output: Stage2CacheData = await service.getCachedData(userId, rawPosts);

            //first community has 3 views
            expect(output.perCommunitySeenPost[community1]).toBe(3);
        });

        it('should initialize community counts to 0 in the output data if it has not been seen', async () => {
            //run test
            const output: Stage2CacheData = await service.getCachedData(userId, rawPosts);

            //second community should be initialized as 0
            expect(output.perCommunitySeenPost[community2]).toBe(0);
        });

        it('should set the seen posts as true in the output data', async () => {
            //run test
            const output: Stage2CacheData = await service.getCachedData(userId, rawPosts);

            //first post has been cached
            expect(output.cachedPosts[`MOCK${postId}`]).toBe(true);
        });

        it('should not add the unseen posts to the output data', async () => {
            //run test
            const output: Stage2CacheData = await service.getCachedData(userId, rawPosts);

            //second post has not been cached
            expect(output.cachedPosts[`MOCK${postId + 1}`]).toBe(undefined);
        });
    });
});
