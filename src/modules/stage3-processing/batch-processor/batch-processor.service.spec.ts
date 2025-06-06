import { Test, TestingModule } from '@nestjs/testing';
import { BatchProcessorService } from './batch-processor.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { GET_PRE_CACHE_LOCK_KEY, GET_PRE_CACHE_KEY } from '../../../configs/cache-keys/keys';
import { ConcurrentBatch, SortedPost } from '../../../utils/types';
import { BUFFER } from '../../../configs/stage-3-lock-buffer/config';
import { SortDataService } from '../sort-data/sort-data.service';
import { MetadataManagementService } from '../metadata-management/metadata-management.service';
import { Stage3CacheManagementService } from '../stage3-cache-management/stage3-cache-management.service';

describe('BatchProcessorService', () => {
    let service: BatchProcessorService;
    let lockService: AquireMutexService;
    let stage3CacheService: Stage3CacheManagementService;

    //test configuration data
    const USER_ID = '123321';
    const MODE = DiscoveryModes.FOLLOWED_SUBSECTION;

    const lock = {
        dataPath: GET_PRE_CACHE_KEY(USER_ID, MODE),
        lockPath: GET_PRE_CACHE_LOCK_KEY(USER_ID, MODE),
        uniqueSignature: 'ASDASD',
        expAt: new Date().getTime() + 999999,
    };

    //mocking concurrent batches
    const genMockedBatch = async (
        size: number,
        scoreStart = 40,
        sec = 'category',
    ): ConcurrentBatch => {
        const batch: SortedPost[] = [];
        for (let i = 0; i < size; i++) {
            batch.push({
                id: `${i}`,
                sec: sec,
                seen: false,
                vote: 0,
                score: scoreStart - i,
            });
        }
        return batch;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchProcessorService,
                {
                    provide: AquireMutexService,
                    useValue: {
                        aquireLock: () => jest.fn(),
                        releaseLock: () => jest.fn(),
                    },
                },
                {
                    provide: SortDataService,
                    useValue: {
                        parseCurrentCachedData: () => jest.fn(),
                        sortData: () => jest.fn(),
                    },
                },
                {
                    provide: MetadataManagementService,
                    useValue: {
                        getAdditionsAndRemovals: () => jest.fn(),
                        removePostsThatFailedMetaWrite: () => jest.fn(),
                    },
                },
                {
                    provide: Stage3CacheManagementService,
                    useValue: {
                        getCurrentPrecachePoolData: () => jest.fn(),
                        updatePostMetaData: () => jest.fn(),
                        updateThePoolData: () => jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BatchProcessorService>(BatchProcessorService);
        lockService = module.get<AquireMutexService>(AquireMutexService);
        stage3CacheService = module.get<Stage3CacheManagementService>(Stage3CacheManagementService);

        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        acquireLockSpy.mockResolvedValue(lock);
    });

    afterEach(() => {
        const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
        const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');

        acquireLockSpy.mockReset();
        releaseLockSpy.mockReset();
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

    describe('remove the lock', () => {
        it('should remove the lock on the cache pool', async () => {
            const releaseLockSpy = jest.spyOn(lockService, 'releaseLock');

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
                expAt: new Date().getTime() - BUFFER - 1,
            };

            //setup spies
            const getCurrentPrecachePoolDataSpy = jest.spyOn(
                stage3CacheService,
                'getCurrentPrecachePoolData',
            );
            const updatePostMetaDataSpy = jest.spyOn(stage3CacheService, 'updatePostMetaData');
            const updateThePoolDataSpy = jest.spyOn(stage3CacheService, 'updateThePoolData');
            const acquireLockSpy = jest.spyOn(lockService, 'aquireLock');
            acquireLockSpy.mockReset().mockResolvedValue(lock);

            //run test
            await service.processBatches(USER_ID, MODE, [genMockedBatch(5)]);

            //expect it to call the initial get data then "when" the lock expires, it should
            // abort and not write any data
            expect(getCurrentPrecachePoolDataSpy).toBeCalled();
            expect(updatePostMetaDataSpy).not.toBeCalled();
            expect(updateThePoolDataSpy).not.toBeCalled();
        });
    });
});
