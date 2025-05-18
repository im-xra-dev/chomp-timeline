import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { BatchCalculatorService } from './batch-calculator.service';
import { TLineCalculatorService } from '../t-line-calculator/t-line-calculator.service';
import { TLineCalculatorConfigService } from '../../configs/t-line-calculator.config/t-line-calculator.config.service';
import { TlineCacherService } from '../tline-cacher/tline-cacher.service';
import { AssertionError } from 'assert';
import { RawPost } from '../../utils/types';
import getRaw from '../../utils/getRawPostObject.spec.util';
import getSortedPostObj from '../../utils/getSortedPostObject.spec.util';

describe('BatchCalculatorService', () => {
    let service: BatchCalculatorService;
    let tLineCalculatorService: TLineCalculatorService;
    let tlineCacherService: TlineCacherService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchCalculatorService,
                TLineCalculatorService,
                TLineCalculatorConfigService,
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                        mutex: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BatchCalculatorService>(BatchCalculatorService);
        tLineCalculatorService = module.get<TLineCalculatorService>(TLineCalculatorService);
        tlineCacherService = module.get<TlineCacherService>(TlineCacherService);
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
            const cacheSpy = jest.spyOn(tlineCacherService, 'dispatch');
            cacheSpy.mockResolvedValueOnce(undefined);

            //sets up input data and runs the test
            const inputData: RawPost[] = [
                getRaw(0, 'a'),
                getRaw(1, 'a'),
                getRaw(2, 'a'),
                getRaw(3, 'a'),
            ];

            await service.batchCalculate(inputData, 0, "userId");

            expect(spy).toHaveBeenNthCalledWith(1, RAW_SCORE, 0);
            expect(spy).toHaveBeenNthCalledWith(2, RAW_SCORE, 1);
            expect(spy).toHaveBeenNthCalledWith(3, RAW_SCORE, 2);
            expect(spy).toHaveBeenNthCalledWith(4, RAW_SCORE, 3);
        });
    });

    describe('getCachedSeenCount', () => {
        it('should return the value stored in "seenData" if it exists', async () => {
            //if the value is locally cached, it should return that value
            const cacheRef = { test: 69 };
            const out = await service.getCachedSeenCount(cacheRef, 'test', "userId");
            expect(out).toBe(69);
        });

        it('should return the value from redis if it exists', async () => {
            //if the value is not locally cached, it should query it from redis
            //if a value is returned, that is returned and stored in the cache
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(69);

            const cacheRef = {};
            const out = await service.getCachedSeenCount(cacheRef, 'test', "userId");

            expect(out).toBe(69);
            expect(cacheRef['test']).toBe(69);
        });

        it('should return 0 if value is not in local or redis cache', async () => {
            //if the value is not locally cached, it should query it from redis
            //if a value is not returned, it should default to 0, returning and locally caching 0
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(undefined);

            const cacheRef = {};
            const out = await service.getCachedSeenCount(cacheRef, 'test', "userId");
            expect(out).toBe(0);
            expect(cacheRef['test']).toBe(0);
        });
    });

    describe('sortHighToLow', () => {
        it('should insert the first post at index 0', () => {
            //ensures element 0 contains the first element
            const sorter = [];
            service.sortHighToLow(sorter, getSortedPostObj(0, 10));
            expect(sorter[0].id).toBe('MOCK0');
        });

        it('should insert the worst post at the end', () => {
            //ensures lowest ranked posts are sorted at the bottom
            const sorter = [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.sortHighToLow(sorter, getSortedPostObj(0, 0));
            expect(sorter[3].id).toBe('MOCK0');
        });

        it('should insert the best post at index 0', () => {
            //ensures highest ranked posts are sorted to the top
            const sorter = [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.sortHighToLow(sorter, getSortedPostObj(0, 10));
            expect(sorter[0].id).toBe('MOCK0');
        });

        it('should insert posts with identical scores at the bottom of the ones containing that score', () => {
            //place identical posts at the bottom, as there is no point
            //iterating over the posts of the same score for no reason
            const sorter = [getSortedPostObj(1, 9)];
            service.sortHighToLow(sorter, getSortedPostObj(0, 9));
            expect(sorter[1].id).toBe('MOCK0');
        });
    });

    describe('reject posts seen in this session', () => {
        it('should reject posts that have a seen sess id equal to the current session', () => {

        });

        it('should reject posts that are in the metadata cache as they are already in a pool', ()=> {

        });

        it('should not reject posts that are of a different sess id and not in the metadata cache', () => {

        });
    })

    describe('reject muted', () => {
        it('should reject posts by muted authors', ()=> {

        })
        it('should reject posts in muted communities', ()=> {

        })
    })
});
