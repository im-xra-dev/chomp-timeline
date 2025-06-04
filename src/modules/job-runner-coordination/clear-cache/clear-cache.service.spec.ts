import { Test, TestingModule } from '@nestjs/testing';
import { ClearCacheService } from './clear-cache.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import {
    GET_CACHE_SIZE_KEY,
    GET_FINAL_POOL_KEY,
    GET_METADATA_KEY, GET_PER_CACHE_LIMIT_KEY, GET_PER_CACHE_SKIP_KEY,
    GET_PRE_CACHE_KEY,
    GET_PRE_CACHE_LOCK_KEY,
    GET_SESSION_KEY,
} from '../../../configs/cache-keys/keys';
import modes from '../../../configs/pre-cache-configuration/cleanup-modes';
import { AquiredLock, AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { CacheClearJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';

describe('ClearCacheService', () => {
    let service: ClearCacheService;
    let lockService: AquireMutexService;

    const RedisMock = {
        del: jest.fn(),
        lRange: jest.fn(),
        exec: jest.fn(),
    };

    const mockClient = {
        multi: () => RedisMock,
        del: jest.fn(),
    };

    const USER_ID = '123321';
    let locks: AquiredLock[] = [];

    const lockGenerator = async (lockPath: string, dataPath: string): Promise<AquiredLock> => {
        const newLock: AquiredLock = {
            dataPath: dataPath,
            lockPath: lockPath,
            uniqueSignature: 'ABCDEF',
            expAt: new Date().getTime() + 999999,
        };
        locks.push(newLock);
        return newLock;
    };

    const mockClearJob: CacheClearJobListing = {
        jobid: '123321',
        userid: USER_ID,
        jobType: JobTypes.CLEAR_CACHE,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClearCacheService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: () => mockClient,
                    },
                },
                {
                    provide: AquireMutexService,
                    useValue: {
                        aquireLock: jest.fn(),
                        releaseLock: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClearCacheService>(ClearCacheService);
        lockService = module.get<AquireMutexService>(AquireMutexService);

        jest.spyOn(lockService, 'releaseLock').mockResolvedValue(true);
        jest.spyOn(lockService, 'aquireLock').mockImplementation(lockGenerator);

        RedisMock.exec.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.spyOn(lockService, 'aquireLock').mockReset();
        mockClient.del.mockReset();
        RedisMock.del.mockReset();
        RedisMock.lRange.mockReset();
        RedisMock.exec.mockReset();
        locks = [];
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('should clear all the cache elements', () => {
        it('should clear the session ID', async () => {
            await service.clearCacheJob(mockClearJob);
            expect(RedisMock.del).toBeCalledWith(GET_SESSION_KEY(USER_ID));
        });

        it('should acquire locks on all the pre-caches', async () => {
            await service.clearCacheJob(mockClearJob);
            for (let i = 0; i < modes.length; i++)
                expect(lockService.aquireLock).toBeCalledWith(
                    GET_PRE_CACHE_LOCK_KEY(USER_ID, modes[i]),
                    GET_PRE_CACHE_KEY(USER_ID, modes[i]),
                );
        });

        it('should load all pre-cached posts into memory', async () => {
            await service.clearCacheJob(mockClearJob);
            for (let i = 0; i < modes.length; i++)
                expect(RedisMock.lRange).toBeCalledWith(
                    GET_PRE_CACHE_KEY(USER_ID, modes[i]),
                    0,
                    -1,
                );
        });

        it('should clear all the pre-caches', async () => {
            await service.clearCacheJob(mockClearJob);
            for (let i = 0; i < modes.length; i++)
                expect(RedisMock.del).toBeCalledWith(GET_PRE_CACHE_KEY(USER_ID, modes[i]));
        });

        it('should clear all pre-cache metadata (cachesize, skip, limit)', async () => {
            await service.clearCacheJob(mockClearJob);
            for (let i = 0; i < modes.length; i++){
                expect(RedisMock.del).toBeCalledWith(GET_PER_CACHE_SKIP_KEY(USER_ID, modes[i]));
                expect(RedisMock.del).toBeCalledWith(GET_PER_CACHE_LIMIT_KEY(USER_ID, modes[i]));
                expect(RedisMock.del).toBeCalledWith(GET_CACHE_SIZE_KEY(USER_ID, modes[i]));
            }
        });

        it('should release locks on all the pre-caches', async () => {
            await service.clearCacheJob(mockClearJob);
            for (let i = 0; i < locks.length; i++)
                expect(lockService.releaseLock).toBeCalledWith(locks[i]);
        });

        it('read the content of the final pool', async () => {
            await service.clearCacheJob(mockClearJob);
            expect(RedisMock.lRange).toBeCalledWith(GET_FINAL_POOL_KEY(USER_ID), 0, -1);
        });

        it('should clear the final pool cache', async () => {
            await service.clearCacheJob(mockClearJob);
            expect(RedisMock.del).toBeCalledWith(GET_FINAL_POOL_KEY(USER_ID));
        });

        it('should clear final pool cachesize', async () => {
            await service.clearCacheJob(mockClearJob);
                expect(RedisMock.del).toBeCalledWith(GET_CACHE_SIZE_KEY(USER_ID, "finalpool"));
        });

        it('should remove the metadata for the IDs which were returned', async () => {
            //setup test data
            const precache1 = ['a', 'b', 'c', 'd', 'e', 'f'];
            const precache2 = ['g', 'h', 'i', 'j', 'k', 'l'];
            const dataReturnedFromRedis = [1, 1, precache1, 1, precache2, 1, [], 0, null];

            //IDs returned should be parsed to include the path prefix
            const metadataKeys: string[] = [];
            mutatorParseKeys(metadataKeys, precache1);
            mutatorParseKeys(metadataKeys, precache2);

            RedisMock.exec.mockResolvedValue(dataReturnedFromRedis);

            //run test
            await service.clearCacheJob(mockClearJob);

            expect(mockClient.del).toBeCalledWith(metadataKeys);
            expect(mockClient.del).toBeCalledTimes(1);
        });

        //util to convert ID to metadata key
        const mutatorParseKeys = (refMetadataKeys: string[], data: string[]) => {
            for (let i = 0; i < data.length; i++)
                refMetadataKeys.push(GET_METADATA_KEY(USER_ID, data[i]));
        };
    });
});
