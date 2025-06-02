import { Test, TestingModule } from '@nestjs/testing';
import { AquiredLock, AquireMutexService } from './aquire-mutex.service';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { GET_PRE_CACHE_KEY, GET_PRE_CACHE_LOCK_KEY } from '../../../configs/cache-keys/keys';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { MUTEX_LOCK_EXPIRE } from '../../../configs/cache-expirations/expire';
import { FAILSAFE_ACQUIRE_LOCK_RECURSION } from '../../../configs/failsafes/limits';
import { AcquireLockError } from '../../../errors/AcquireLockError';

describe('AquireMutexService', () => {
    let service: AquireMutexService;

    const redisMock = {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AquireMutexService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: () => redisMock,
                    },
                },
            ],
        }).compile();

        service = module.get<AquireMutexService>(AquireMutexService);
    });

    afterEach(() => {
        redisMock.del.mockReset();
        redisMock.set.mockReset();
        redisMock.get.mockReset();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('failsafe test', () => {
        it('should throw if recursion >= FAILSAFE_ACQUIRE_LOCK_RECURSION', async () => {
            //setup spy
            jest.spyOn(redisMock, 'set').mockResolvedValue(null);

            //try and run the function at max depth
            try {
                await service.aquireLock('test', 'testdata', FAILSAFE_ACQUIRE_LOCK_RECURSION);
                expect('this line').toBe('never executed due to failsafe throwing');
            } catch (e) {
                //ensure thrown error is correct type
                const thrower = () => {throw e}
                expect(thrower).toThrow(AcquireLockError);
            }
        });
    });

    describe('acquires lock on a path in the redis database', () => {
        function validateOutput(lock: AquiredLock, CACHE_LOCK_PATH: string, CACHE_PATH: string) {
            expect(lock.lockPath).toBe(CACHE_LOCK_PATH);
            expect(lock.dataPath).toBe(CACHE_PATH);
            //check the lock timeout is set correctly, with some tolerance for processing time (500ms)
            expect(lock.expAt).toBeGreaterThan(
                new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000 - 500,
            );
            expect(lock.expAt).toBeLessThanOrEqual(new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000);
        }

        it('should acquire a lock on an unlocked path', async () => {
            //init data
            const userId = '123';
            const CACHE_PATH = GET_PRE_CACHE_KEY(userId, DiscoveryModes.FOLLOWED_USER);
            const CACHE_LOCK_PATH = GET_PRE_CACHE_LOCK_KEY(userId, DiscoveryModes.FOLLOWED_USER);

            //setup spies
            const setSpy = jest.spyOn(redisMock, 'set');
            setSpy.mockImplementation(
                (path: string, signature: string, params: { EX: number; NX: boolean }) => {
                    expect(path).toBe(CACHE_LOCK_PATH);
                    expect(params.EX).toBe(MUTEX_LOCK_EXPIRE);
                    expect(params.NX).toBe(true);

                    return 'OK';
                },
            );

            //run test
            const output = await service.aquireLock(CACHE_LOCK_PATH, CACHE_PATH);

            //validate test
            expect(setSpy).toHaveBeenCalledTimes(1);
            validateOutput(output, CACHE_LOCK_PATH, CACHE_PATH);
        });
        it('should acquire a lock on an locked path after the lock has been released', async () => {
            //init data
            const userId = '123';
            const CACHE_PATH = GET_PRE_CACHE_KEY(userId, DiscoveryModes.FOLLOWED_USER);
            const CACHE_LOCK_PATH = GET_PRE_CACHE_LOCK_KEY(userId, DiscoveryModes.FOLLOWED_USER);

            //setup spies
            const setSpy = jest.spyOn(redisMock, 'set');
            setSpy.mockImplementation(
                (path: string, signature: string, params: { EX: number; NX: boolean }) => {
                    expect(path).toBe(CACHE_LOCK_PATH);
                    expect(params.EX).toBe(MUTEX_LOCK_EXPIRE);
                    expect(params.NX).toBe(true);

                    return 'OK';
                },
            );
            //mocks the first reply to be null, meaning the lock is already held
            setSpy.mockResolvedValueOnce(null);

            //run test
            const output = await service.aquireLock(CACHE_LOCK_PATH, CACHE_PATH);

            //validate test
            expect(setSpy).toHaveBeenCalledTimes(2);
            validateOutput(output, CACHE_LOCK_PATH, CACHE_PATH);
        });
    });

    describe('release lock on a path in the redis database', () => {
        it('should release a lock on a path held by the AquiredLock', async () => {
            //init data
            const userId = '123';
            const signature = '123456';
            const lockPath = GET_PRE_CACHE_LOCK_KEY(userId, DiscoveryModes.FOLLOWED_USER);
            const lock: AquiredLock = {
                expAt: new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000,
                dataPath: GET_PRE_CACHE_KEY(userId, DiscoveryModes.FOLLOWED_USER),
                lockPath: lockPath,
                uniqueSignature: signature,
            };

            //setup spies
            const getSpy = jest.spyOn(redisMock, 'get');
            const delSpy = jest.spyOn(redisMock, 'del');
            getSpy.mockResolvedValue(signature);

            //run test
            const output = await service.releaseLock(lock);

            //validate test
            expect(output).toBe(true);
            expect(delSpy).toHaveBeenCalledWith(lockPath);
            expect(getSpy).toHaveBeenCalledWith(lockPath);
        });
        it('should fail to release the lock if expAt is in the past', async () => {
            //init data
            const userId = '123';
            const signature = '123456';
            const lockPath = GET_PRE_CACHE_LOCK_KEY(userId, DiscoveryModes.FOLLOWED_USER);
            const lock: AquiredLock = {
                expAt: new Date().getTime() - 1,
                dataPath: GET_PRE_CACHE_KEY(userId, DiscoveryModes.FOLLOWED_USER),
                lockPath: lockPath,
                uniqueSignature: signature,
            };

            //setup spies
            const getSpy = jest.spyOn(redisMock, 'get');
            const delSpy = jest.spyOn(redisMock, 'del');

            //run test
            const output = await service.releaseLock(lock);

            //validate test
            expect(output).toBe(false);
            expect(delSpy).not.toHaveBeenCalled();
            expect(getSpy).not.toHaveBeenCalled();
        });
        it('should fail to release the lock on a path not held AquiredLock', async () => {
            //init data
            const userId = '123';
            const signature = '123456';
            const lockPath = GET_PRE_CACHE_LOCK_KEY(userId, DiscoveryModes.FOLLOWED_USER);
            const lock: AquiredLock = {
                expAt: new Date().getTime() + MUTEX_LOCK_EXPIRE * 1000,
                dataPath: GET_PRE_CACHE_KEY(userId, DiscoveryModes.FOLLOWED_USER),
                lockPath: lockPath,
                uniqueSignature: signature,
            };

            //setup spies
            const getSpy = jest.spyOn(redisMock, 'get');
            const delSpy = jest.spyOn(redisMock, 'del');
            getSpy.mockResolvedValue(signature + 'A'); //not this locks signature

            //run test
            const output = await service.releaseLock(lock);

            //validate test
            expect(output).toBe(false);
            expect(delSpy).not.toHaveBeenCalled();
            expect(getSpy).toHaveBeenCalledWith(lockPath);
        });
    });
});
