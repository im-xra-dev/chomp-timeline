import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { BatchCalculatorService } from './batch-calculator.service';
import { Stage2CalculationsService } from '../stage2-calculations/stage2-calculations.service';
import { TLineCalculatorConfigService } from '../../../configs/t-line-calculator.config/t-line-calculator.config.service';
import { AssertionError } from 'assert';
import { RawPost } from '../../../utils/types';
import getRaw from '../../../utils/getRawPostObject.spec.util';
import getSortedPostObj from '../../../utils/getSortedPostObject.spec.util';
import { Stage2CacheManagementService } from '../stage2-cache-management/stage2-cache-management.service';

describe('BatchCalculatorService', () => {
    let service: BatchCalculatorService;
    let tLineCalculatorService: Stage2CalculationsService;
    let cacherService: Stage2CacheManagementService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchCalculatorService,
                Stage2CalculationsService,
                TLineCalculatorConfigService,
                {
                    provide: Stage2CacheManagementService,
                    useValue: {
                        getCachedData: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BatchCalculatorService>(BatchCalculatorService);
        tLineCalculatorService = module.get<Stage2CalculationsService>(Stage2CalculationsService);
        cacherService = module.get<Stage2CacheManagementService>(Stage2CacheManagementService);

        // const cacheSpy = jest.spyOn(tlineCacherService, 'dispatch');
        // cacheSpy.mockResolvedValueOnce('sess-not-seen');
        // cacheSpy.mockResolvedValueOnce(false);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    //INTEGRATION TEST
    it('should sort the batch from high to low, rejecting irrelevant posts', async () => {
        //ensures the function runs when integrated with its utilities
        //This does not test integrations with other services, just the utilities
        //provided for this service specifically

        const REJECT_SCORE = 1;

        //spy on the relevance calculation and reject 1st post at relevance stage
        //other posts move to next stage
        //the score is not too important here as it passes to the next stage so long as
        //it is greater than the reject score
        const relevanceSpy = jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore');
        relevanceSpy.mockReturnValueOnce(REJECT_SCORE);
        relevanceSpy.mockReturnValue(REJECT_SCORE + 1);

        //spy on the weight calculator and return scores
        //checks 2 equal scores, high then low, low then high
        //and the final post gets rejected at this stage
        const weightSpy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
        weightSpy.mockReturnValueOnce(10);
        weightSpy.mockReturnValueOnce(11);
        weightSpy.mockReturnValueOnce(9);
        weightSpy.mockReturnValueOnce(29);
        weightSpy.mockReturnValueOnce(9);
        weightSpy.mockReturnValueOnce(2);
        weightSpy.mockReturnValueOnce(REJECT_SCORE);

        //mock the cache service
        const cacheSpy = jest.spyOn(cacherService, 'getCachedData');
        cacheSpy.mockResolvedValueOnce({ sessId: "test", cachedPosts: {}, perCommunitySeenPost: {"tests0":0}});

        //generates the mock data and expected output
        const expectedOrder: string[] = ['MOCK3', 'MOCK1', 'MOCK0', 'MOCK2', 'MOCK4', 'MOCK5'];
        const inputData: RawPost[] = [
            getRaw(-1),
            getRaw(0),
            getRaw(1),
            getRaw(2),
            getRaw(3),
            getRaw(4),
            getRaw(5),
            getRaw(6),
        ];

        const output = await service.batchCalculate(inputData, REJECT_SCORE, 'userId');

        expect(output.length).toBe(expectedOrder.length);
        for (let i = 0; i < expectedOrder.length; i++) {
            expect(output[i].id).toBe(expectedOrder[i]);
        }
    });

    describe('batchCalculate', () => {
        beforeEach(()=>{
            const cacheSpy = jest.spyOn(cacherService, 'getCachedData');
            cacheSpy.mockResolvedValueOnce({ sessId: "test", cachedPosts: {}, perCommunitySeenPost: {"tests0":0}});
        })

        it('should throw if minScore < 0', async () => {
            //The reject score should never be negative
            const call = async () => {
                await service.batchCalculate([], -1, 'userId');
            };
            await expect(call()).rejects.toThrow(AssertionError);
        });

        it('should not throw if minScore === 0', async () => {
            //0 is on the boundary, but is valid
            const call = async () => {
                await service.batchCalculate([], 0, 'userId');
                return true;
            };
            await expect(call()).resolves.toBe(true);
        });

        it('should return an empty array if an empty array is provided', async () => {
            //tests that the system doesnt get confused if the batch is empty for some reason
            const output = await service.batchCalculate([], 10, 'userId');
            expect(output.length).toBe(0);
        });

        it('should drop rawScore <= minScore posts', async () => {
            //test that the posts are dropped correctly at the relevance score stage

            const REJECT_SCORE = 10;

            //everything <= REJECT_SCORE should be rejected
            //everything >  REJECT_SCORE is valid
            const spy = jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore');
            spy.mockReturnValueOnce(REJECT_SCORE - 1);
            spy.mockReturnValueOnce(REJECT_SCORE);
            spy.mockReturnValueOnce(REJECT_SCORE + 1);

            const output = await service.batchCalculate(
                [getRaw(0), getRaw(1), getRaw(2)],
                REJECT_SCORE,
                'userId',
            );

            expect(output.length).toBe(1);
            expect(output[0].id).toBe('MOCK2');
        });
        it('should drop weightedScore <= minScore posts', async () => {
            //test that the posts are dropped correctly at the weighting score stage
            const REJECT_SCORE = 10;

            //ensure posts are not rejected at the relevance stage and can pass on to the
            //weighting stage
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(
                REJECT_SCORE + 1,
            );

            //everything <= REJECT_SCORE should be rejected
            //everything >  REJECT_SCORE is valid
            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            spy.mockReturnValueOnce(REJECT_SCORE - 1);
            spy.mockReturnValueOnce(REJECT_SCORE);
            spy.mockReturnValueOnce(REJECT_SCORE + 1);

            const output = await service.batchCalculate(
                [getRaw(0), getRaw(1), getRaw(2)],
                REJECT_SCORE,
                'userId',
            );

            expect(output.length).toBe(1);
            expect(output[0].id).toBe('MOCK2');
        });

        it('should decrease weight of identical posts by total processed/seen (in same sec)', async () => {
            //ensures identical weightings in the same category are weighted for diversity of the timeline
            //this is done by incrementing the local cache after each post
            const RAW_SCORE = 100;

            //the spy is called with the parameters we are checking
            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            spy.mockImplementation(jest.fn());

            //tests should pass through the relevance checks
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(
                RAW_SCORE,
            );

            //set up the cache spy to initialize the local cache
            //the local cache should be used after it has been initialized
            const cacheSpy = jest.spyOn(cacherService, 'getCachedData').mockReset();
            cacheSpy.mockResolvedValueOnce({ sessId: "test", cachedPosts: {}, perCommunitySeenPost: {"a":0}});

            //sets up input data and runs the test
            const inputData: RawPost[] = [
                getRaw(0, 'a'),
                getRaw(1, 'a'),
                getRaw(2, 'a'),
                getRaw(3, 'a'),
            ];

            await service.batchCalculate(inputData, 0, 'userId');

            expect(spy).toHaveBeenNthCalledWith(1, RAW_SCORE, 0);
            expect(spy).toHaveBeenNthCalledWith(2, RAW_SCORE, 1);
            expect(spy).toHaveBeenNthCalledWith(3, RAW_SCORE, 2);
            expect(spy).toHaveBeenNthCalledWith(4, RAW_SCORE, 3);
        });
    });

    describe('sortHighToLow', () => {
        it('should insert the first post at index 0', () => {
            //ensures element 0 contains the first element
            const sorter = [];
            service.insertPostInPlaceHighToLow(sorter, getRaw(0), 10);
            expect(sorter[0].id).toBe('MOCK0');
        });

        it('should insert the worst post at the end', () => {
            //ensures lowest ranked posts are sorted at the bottom
            const sorter = [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.insertPostInPlaceHighToLow(sorter, getRaw(0), 0);
            expect(sorter[3].id).toBe('MOCK0');
        });

        it('should insert the best post at index 0', () => {
            //ensures highest ranked posts are sorted to the top
            const sorter = [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.insertPostInPlaceHighToLow(sorter, getRaw(0), 10);
            expect(sorter[0].id).toBe('MOCK0');
        });

        it('should insert posts with identical scores at the bottom of the ones containing that score', () => {
            //place identical posts at the bottom, as there is no point
            //iterating over the posts of the same score for no reason
            const sorter = [getSortedPostObj(1, 9)];
            service.insertPostInPlaceHighToLow(sorter, getRaw(0), 9);
            expect(sorter[1].id).toBe('MOCK0');
        });
    });

    describe('reject posts seen in this session', () => {
        it('should reject posts that have a seen sess id equal to the current session', async () => {
            //mock already seen with equal session
            const spy = jest.spyOn(cacherService, 'getCachedData')
            spy.mockResolvedValueOnce({ sessId: "sess", cachedPosts: {}, perCommunitySeenPost: {"tests0":0}});

            const output = await service.batchCalculate([getRaw(0)], 0, 'userId');

            expect(output.length).toBe(0);
        });

        it('should reject posts that are in the metadata cache as they are already in a pool', async () => {
            //mock already in cachedPosts
            const spy = jest.spyOn(cacherService, 'getCachedData')
            spy.mockResolvedValueOnce({ sessId: "sess-not-seen", cachedPosts: {"MOCK0": true}, perCommunitySeenPost: {"tests0":0}});

            const output = await service.batchCalculate([getRaw(0)], 0, 'userId');

            expect(output.length).toBe(0);
        });

        it('should not reject posts that are of a different sess id and not in the metadata cache', async () => {
            //mock not seen
            const spy = jest.spyOn(cacherService, 'getCachedData')
            spy.mockResolvedValueOnce({ sessId: "sess-not-seen", cachedPosts: {}, perCommunitySeenPost: {"tests0":0}});

            const output = await service.batchCalculate([getRaw(0)], 0, 'userId');

            expect(output.length).toBe(1);
        });
    });

    describe('reject muted', () => {
        it('should reject posts by muted authors', async () => {
            const mutedUser = getRaw(0, 'sec', true, false);
            const output = await service.batchCalculate([mutedUser], 0, 'userId');
            expect(output.length).toBe(0);
        });
        it('should reject posts in muted communities', async () => {
            const mutedCommunity = getRaw(0, 'sec', false, true);
            const output = await service.batchCalculate([mutedCommunity], 0, 'userId');
            expect(output.length).toBe(0);
        });
    });
});
