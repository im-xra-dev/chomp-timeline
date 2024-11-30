import {Test, TestingModule} from '@nestjs/testing';
import {describe, expect, it, beforeEach} from "@jest/globals";
import {BatchCalculatorService} from './batch-calculator.service';
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {TLineCalculatorConfigService} from "../../configs/t-line-calculator.config/t-line-calculator.config.service";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {AssertionError} from 'assert'
import {RawPost} from "../t-line/utils/types";
import getRaw from '../../utils/getRawPostObject.spec.util'
import getSortedPostObj from '../../utils/getSortedPostObject.spec.util'

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
                    }
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

    //ensures the function runs when integrated with its utilities
    it('should sort the batch from high to low, rejecting irrelevant posts', async () => {
        const MIN_SCORE = 1;
        const relevanceSpy = jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore');
        relevanceSpy.mockReturnValueOnce(MIN_SCORE); //reject 1st post at relevance stage
        relevanceSpy.mockReturnValue(MIN_SCORE+1);  //other posts move to next stage
        const weightSpy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
        weightSpy.mockReturnValueOnce(10);
        weightSpy.mockReturnValueOnce(11);
        weightSpy.mockReturnValueOnce(9);
        weightSpy.mockReturnValueOnce(29);
        weightSpy.mockReturnValueOnce(9);
        weightSpy.mockReturnValueOnce(2);
        weightSpy.mockReturnValueOnce(MIN_SCORE); //reject this post at calculate weight stage
        const expectedOrder: string[] = ["MOCK3", "MOCK1", "MOCK0", "MOCK2", "MOCK4", "MOCK5",];
        const inputData: RawPost[] =
            [getRaw(-1), getRaw(0), getRaw(1), getRaw(2),
                getRaw(3), getRaw(4), getRaw(5), getRaw(6)];

        const output = await service.batchCalculate(inputData, MIN_SCORE);

        expect(output.length).toBe(expectedOrder.length);
        for (let i = 0; i < expectedOrder.length; i++) {
            expect(output[i].id).toBe(expectedOrder[i])
        }
    });

    describe('batchCalculate', () => {
        //test the function with different parameter states
        it('should throw if minScore < 0', async () => {
            const call = async () => {
                await service.batchCalculate([], -1);
            };
            await expect(call()).rejects.toThrow(AssertionError);
        });
        it('should not throw if minScore === 0', async () => {
            const call = async () => {
                await service.batchCalculate([], 0);
                return true;
            };
            await expect(call()).resolves.toBe(true);
        });
        it('should return an empty array if an empty array is provided', async () => {
            const output = await service.batchCalculate([], 10);
            expect(output.length).toBe(0)
        });

        //test that the posts are dropped correctly
        it('should drop rawScore <= minScore posts', async () => {
            const MIN_SCORE = 10;
            const spy = jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore');
            spy.mockReturnValueOnce(MIN_SCORE - 1);
            spy.mockReturnValueOnce(MIN_SCORE);
            spy.mockReturnValueOnce(MIN_SCORE + 1);

            const output = await service.batchCalculate([
                getRaw(0), getRaw(1), getRaw(2)
            ], MIN_SCORE);

            expect(output.length).toBe(1);
            expect(output[0].id).toBe("MOCK2");
        });
        it('should drop weightedScore <= minScore posts', async () => {
            const MIN_SCORE = 10;
            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(MIN_SCORE + 1);
            spy.mockReturnValueOnce(MIN_SCORE - 1);
            spy.mockReturnValueOnce(MIN_SCORE);
            spy.mockReturnValueOnce(MIN_SCORE + 1);

            const output = await service.batchCalculate([
                getRaw(0), getRaw(1), getRaw(2)
            ], MIN_SCORE);

            expect(output.length).toBe(1);
            expect(output[0].id).toBe("MOCK2");
        });

        //ensures identical weightings are weighted for diversity
        it('should decrease weight of identical posts by total processed/seen (in same sec)', async () => {
            const RAW_SCORE = 100;
            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            spy.mockImplementation(jest.fn());
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(0);
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(RAW_SCORE);
            const inputData: RawPost[] =
                [getRaw(0, "a"), getRaw(1, "a"), getRaw(2, "a"), getRaw(3, "a")];

            await service.batchCalculate(inputData, 0);

            expect(spy).toHaveBeenNthCalledWith(1, RAW_SCORE, 0);
            expect(spy).toHaveBeenNthCalledWith(2, RAW_SCORE, 1);
            expect(spy).toHaveBeenNthCalledWith(3, RAW_SCORE, 2);
            expect(spy).toHaveBeenNthCalledWith(4, RAW_SCORE, 3);
        });
    });

    describe('getCachedSeenCount', () => {
        it('should return the value stored in "seenData" if it exists', async ()=>{
            const cacheRef = {"test": 69};
            const out = await service.getCachedSeenCount("test", cacheRef);
            expect(out).toBe(69);
        });
        it('should return the value from redis if it exists', async ()=>{
            const cacheRef = {};
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(69);
            const out = await service.getCachedSeenCount("test", cacheRef);
            expect(out).toBe(69);
        });
        it('should return 0 if value is not in local or redis cache', async ()=>{
            const cacheRef = {};
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(undefined);
            const out = await service.getCachedSeenCount("test", cacheRef);
            expect(out).toBe(0);
        });
    });

    describe('sortHighToLow', () => {
        it('should insert the first post at index 0', ()=>{
            const sorter = [];
            service.sortHighToLow(sorter, getSortedPostObj(0, 10));
            expect(sorter[0].id).toBe('MOCK0');
        });
        it('should insert the worst post at the end', ()=>{
            const sorter =
                [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.sortHighToLow(sorter, getSortedPostObj(0, 0));
            expect(sorter[3].id).toBe('MOCK0');
        });
        it('should insert the best post at index 0', ()=>{
            const sorter =
                [getSortedPostObj(1, 9), getSortedPostObj(2, 5), getSortedPostObj(3, 1)];
            service.sortHighToLow(sorter, getSortedPostObj(0, 10));
            expect(sorter[0].id).toBe('MOCK0');
        });
    });
});
