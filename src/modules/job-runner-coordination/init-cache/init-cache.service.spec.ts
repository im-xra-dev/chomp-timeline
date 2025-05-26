import { Test, TestingModule } from '@nestjs/testing';
import { InitCacheService } from './init-cache.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { JobTypes } from '../../../utils/JobTypes';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { SESS_ID_EXPIRE } from '../../../configs/cache-expirations/expire';
import { GET_SESSION_KEY } from '../../../configs/cache-keys/keys';

describe('InitCacheService', () => {
    let service: InitCacheService;
    let cache: RedisCacheDriverService;

    const RedisMock = {
        set: jest.fn(),
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InitCacheService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<InitCacheService>(InitCacheService);
        cache = module.get<RedisCacheDriverService>(RedisCacheDriverService);

        // @ts-expect-error - mocked data is only mocking required functions and irrelevant ones are un mocked
        jest.spyOn(cache, 'getClient').mockResolvedValue(RedisMock);
    });

    afterEach(() => {
        RedisMock.set.mockReset();
        RedisMock.get.mockReset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('initialize the cache tests', () => {
        it('should abort if the cache is already initialized', async () => {
            RedisMock.get.mockResolvedValue('dhfaasjk');

            const output: JobTypes = await service.initJob({
                jobType: JobTypes.INIT,
                userid: '123321',
                jobid: '000000',
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER],
                publish: 10,
            });

            expect(output).toBe(JobTypes.ABORT);
        });
        it('should initialize the cache with sessid', async () => {
            const userId = '123321';
            const sessId = 'AAAAAA'

            //set up spy
            jest.spyOn(service, "randomSessionId").mockReturnValue(sessId);
            RedisMock.get.mockResolvedValue(null);

            //run the test
            const output: JobTypes = await service.initJob({
                jobType: JobTypes.INIT,
                userid: userId,
                jobid: '000000',
                modes: [DiscoveryModes.FOLLOWED_SUBSECTION, DiscoveryModes.FOLLOWED_USER],
                publish: 10,
            });

            //check it was valid
            expect(RedisMock.set).toBeCalledWith(GET_SESSION_KEY(userId), sessId, {EX: SESS_ID_EXPIRE});
            expect(output).toBe(JobTypes.CONTINUE);
        });
    });
});
