import { Test, TestingModule } from '@nestjs/testing';
import { Stage1CacheManagementService } from './stage1-cache-management.service';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { QueryJobListing } from '../../../utils/types';
import { JobTypes } from '../../../utils/JobTypes';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { GET_PER_CACHE_LIMIT_KEY, GET_PER_CACHE_SKIP_KEY } from '../../../configs/cache-keys/keys';
import { defaults } from '../../../configs/pre-cache-configuration/defaults';

describe('Stage1CacheManagementService', () => {
    let service: Stage1CacheManagementService;

    const multiMock = {
        get: jest.fn(),
        set: jest.fn(),
        exec: jest.fn(),
    };

    const clientMock = { multi: () => multiMock };

    function getJobListing(modes: DiscoveryModes[], limit = undefined): QueryJobListing{
        return {
            userid: '123',
            jobType: JobTypes.QUERY,
            jobid: '321',
            cache: 1,
            modes: modes,
            query: limit,
        };
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                Stage1CacheManagementService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getClient: () => clientMock,
                    },
                },
            ],
        }).compile();

        service = module.get<Stage1CacheManagementService>(Stage1CacheManagementService);
    });

    afterEach(()=>{
        multiMock.get.mockReset();
        multiMock.set.mockReset();
        multiMock.exec.mockReset();
    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getting the limit and skip for a given job', () => {
        it('should get limit and skip only if the job does not specify a limit', async () => {
            //init data
            const MODE: DiscoveryModes = DiscoveryModes.RECOMMENDED_USER;
            const job: QueryJobListing = getJobListing([MODE]);

            //setup spies
            const getMock = jest.spyOn(multiMock, 'get');
            jest.spyOn(multiMock, 'exec').mockResolvedValue([1000, 999]);

            //run test
            await service.getCacheData(job);

            //validate test
            expect(getMock).toHaveBeenCalledTimes(2);
            expect(getMock).toHaveBeenNthCalledWith(1, GET_PER_CACHE_LIMIT_KEY(job.userid, MODE));
            expect(getMock).toHaveBeenNthCalledWith(2, GET_PER_CACHE_SKIP_KEY(job.userid, MODE));
        });

        it('should not get the data from cache if the limit is specified in the job', async () => {
            //init data
            const MODE: DiscoveryModes = DiscoveryModes.RECOMMENDED_USER;
            const job: QueryJobListing = getJobListing([MODE], 100);

            //setup spies
            const getMock = jest.spyOn(multiMock, 'get');
            const execMock = jest.spyOn(multiMock, 'exec');

            //run test
            await service.getCacheData(job);

            //validate test
            expect(getMock).toHaveBeenCalledTimes(0);
            expect(execMock).toHaveBeenCalledTimes(0);
        });

        it('should get the data for all specified discovery modes', async () => {
            //init data
            const job: QueryJobListing = getJobListing([
                DiscoveryModes.RECOMMENDED_USER,
                DiscoveryModes.FOLLOWED_USER,
                DiscoveryModes.RECOMMENDED_SUBSECTION,
                DiscoveryModes.FOLLOWED_SUBSECTION,
            ]);

            //setup spies
            const getMock = jest.spyOn(multiMock, 'get');
            jest.spyOn(multiMock, 'exec').mockResolvedValue([1000, 999, 888, 777]);

            //run test
            await service.getCacheData(job);

            //validate test
            expect(getMock).toHaveBeenCalledTimes(job.modes.length * 2);
            for (let i = 0; i < job.modes.length * 2; i += 2) {
                expect(getMock).toHaveBeenNthCalledWith(
                    i,
                    GET_PER_CACHE_LIMIT_KEY(job.userid, job.modes[i / 2]),
                );
                expect(getMock).toHaveBeenNthCalledWith(
                    i + 1,
                    GET_PER_CACHE_SKIP_KEY(job.userid, job.modes[i / 2]),
                );
            }
        });
    });

    describe('data should be parsed and formatted', () => {
        it('should use the limit specified in the job and a skip of 0 if the job does specify a limit', async () => {
            //init data
            const MODE: DiscoveryModes = DiscoveryModes.RECOMMENDED_USER;
            const LIMIT = 55;
            const job: QueryJobListing = getJobListing([MODE], LIMIT);

            //run test
            const output = await service.getCacheData(job);

            //validate test
            expect(output[MODE].limit).toHaveBeenCalledTimes(LIMIT);
            expect(output[MODE].skip).toHaveBeenCalledTimes(0);
        });

        it('should format the default data for un-initialized pre-caches', async () => {
            //init data
            const MODE: DiscoveryModes = DiscoveryModes.RECOMMENDED_USER;
            const job: QueryJobListing = getJobListing([MODE]);

            //setup spies
            jest.spyOn(multiMock, 'exec').mockResolvedValue([null, null]);

            //run test
            const output = await service.getCacheData(job);

            //validate test
            expect(output[MODE].limit).toHaveBeenCalledTimes(defaults[MODE].limit);
            expect(output[MODE].skip).toHaveBeenCalledTimes(defaults[MODE].skip);
        });

        it('should format the data returned for each pre-cache', async () => {
            //init data
            const MODE: DiscoveryModes = DiscoveryModes.RECOMMENDED_USER;
            const job: QueryJobListing = getJobListing([MODE]);
            const MOCK_LIMIT = 10;
            const MOCK_SKIP = 20;

            //setup spies
            jest.spyOn(multiMock, 'exec').mockResolvedValue([MOCK_LIMIT, MOCK_SKIP]);

            //run test
            const output = await service.getCacheData(job);

            //validate test
            expect(output[MODE].limit).toHaveBeenCalledTimes(MOCK_LIMIT);
            expect(output[MODE].skip).toHaveBeenCalledTimes(MOCK_SKIP);
        });
    });

    describe('setting the limit and skip if the pre-cache has not been initialized', () => {
        async function run(MODE: DiscoveryModes){
            //init data
            const job: QueryJobListing = getJobListing([MODE]);

            //setup spies
            const setMock = jest.spyOn(multiMock, 'set');
            jest.spyOn(multiMock, 'exec').mockResolvedValue([null, null]);

            //run test
            await service.getCacheData(job);

            //validate test
            expect(setMock).toHaveBeenCalledTimes(2);
            expect(setMock).toHaveBeenNthCalledWith(
                1,
                GET_PER_CACHE_LIMIT_KEY(job.userid, MODE),
                defaults[MODE].limit,
            );
            expect(setMock).toHaveBeenNthCalledWith(
                2,
                GET_PER_CACHE_SKIP_KEY(job.userid, MODE),
                defaults[MODE].skip,
            );

        }

        it('should set the skip/limit to the default value if none is found for RECOMMENDED_USER', async () => {
            await run(DiscoveryModes.RECOMMENDED_USER);
        });
        it('should set the skip/limit to the default value if none is found for FOLLOWED_USER', async () => {
            await run(DiscoveryModes.FOLLOWED_USER);
        });
        it('should set the skip/limit to the default value if none is found for RECOMMENDED_SUBSECTION', async () => {
            await run(DiscoveryModes.RECOMMENDED_SUBSECTION);
        });
        it('should set the skip/limit to the default value if none is found for FOLLOWED_SUBSECTION', async () => {
            await run(DiscoveryModes.FOLLOWED_SUBSECTION);
        });
    });
});
