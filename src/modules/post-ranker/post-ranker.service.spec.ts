import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerService} from './post-ranker.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {NeoQueryService} from "../neo-query/neo-query.service";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {TLineCalculatorConfigService} from '../../configs/t-line-calculator.config/t-line-calculator.config.service'
import {RawPost} from "../t-line/utils/types";
import {InvalidDataError} from "../../utils/InvalidDataError";

describe('PostRankerService', () => {
    let service: PostRankerService;
    let tLineCalculatorService: TLineCalculatorService;
    let tlineCacherService: TlineCacherService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostRankerService,
                TLineCalculatorService,
                TLineCalculatorConfigService,
                {
                    provide: NeoQueryService,
                    useValue: {
                        read: jest.fn(),
                        write: jest.fn(),
                    }
                },
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                        mutex: jest.fn(),
                    }
                },
            ],
        }).compile();

        service = module.get<PostRankerService>(PostRankerService);
        tLineCalculatorService = module.get<TLineCalculatorService>(TLineCalculatorService);
        tlineCacherService = module.get<TlineCacherService>(TlineCacherService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dispatchConcurrentPosts', () => {
        it('should dispatch a total of [bc] batches for given in&out sizes', () => {
            jest.spyOn(service, 'batchCalculate').mockImplementation()

            const inputPosts: RawPost[] = [];
            for (let inCnt = 1; inCnt <= 100; inCnt++) {
                inputPosts.push(getRaw(inCnt));
                for (let outCnt = 1; outCnt <= 100; outCnt++) {
                    const bc = tLineCalculatorService.calculateBatchCount(inCnt, outCnt);
                    const jobBuilder = service.dispatchConcurrentPosts(inputPosts, outCnt, 0)
                    expect(jobBuilder.length).toBe(bc);
                }
            }
        })
        it('should dispatch all posts for given in&out sizes', () => {
            let totalDispatchedCnt = 0; // sum of all [batches.length]
            const mock = jest.fn((a, b) => totalDispatchedCnt += a.length);
            jest.spyOn(service, 'batchCalculate').mockImplementation(mock);

            const inputPosts: RawPost[] = [];
            for (let inCnt = 1; inCnt <= 100; inCnt++) {
                inputPosts.push(getRaw(inCnt));
                for (let outCnt = 1; outCnt <= 100; outCnt++) {
                    totalDispatchedCnt = 0;//reset and run
                    service.dispatchConcurrentPosts(inputPosts, outCnt, 0);
                    expect(totalDispatchedCnt).toBe(inCnt);
                }
            }
        });
        it('should evenly distribute post count across batches', () => {
            const mock = jest.fn((a, b) => a.length);
            jest.spyOn(service, 'batchCalculate').mockImplementation(mock);

            const outCnt = 47; // init
            const inCnt = 777;
            const bc = tLineCalculatorService.calculateBatchCount(inCnt, outCnt);
            const actualBatchSize = Math.floor(inCnt / bc);

            const inputPosts: RawPost[] = []; //generate mock data and run
            for (let i = 0; i < inCnt; i++) inputPosts.push(getRaw(inCnt));
            const data: number[] = ( // data holds values overriden by the mock
                service.dispatchConcurrentPosts(inputPosts, outCnt, 0
                ) as unknown[]) as number[];

            let flag = true; //evaluate the data
            for (let i = 0; i < data.length; i++) {
                const len = data[i];
                if (flag) { // data as [..., n+1, n+1, n+1, n, n, n, ... ]
                    if (len === actualBatchSize) flag = false;
                    else expect(len).toBe(actualBatchSize + 1);
                } else expect(len).toBe(actualBatchSize);
            }
        })
    });

    describe('batchCalculate', () => {
        it('should throw if minScore < 0', async () => {
            const call = async () => {
                await service.batchCalculate([], -1);
            };
            await expect(call).rejects.toThrow(InvalidDataError);
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
        it('should drop score <= minScore posts', async () => {
            const MIN_SCORE = 10;

            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(MIN_SCORE+1);
            spy.mockReturnValueOnce(MIN_SCORE - 1);
            spy.mockReturnValueOnce(MIN_SCORE);
            spy.mockReturnValueOnce(MIN_SCORE + 1);

            const output = await service.batchCalculate([
                getRaw(0), getRaw(1), getRaw(2)
            ], MIN_SCORE);

            expect(output.length).toBe(1);
            expect(output[0].id).toBe("MOCK2");
        });
        it('should sort the batch from high to low', async () => {
            const inputData: RawPost[] =
                [getRaw(0), getRaw(1), getRaw(2), getRaw(3), getRaw(4), getRaw(5)];
            const expectedOrder: string[] = ["MOCK3", "MOCK1", "MOCK0", "MOCK2", "MOCK4", "MOCK5",];
            const spy = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(1);
            spy.mockReturnValueOnce(10);
            spy.mockReturnValueOnce(11);
            spy.mockReturnValueOnce(9);
            spy.mockReturnValueOnce(29);
            spy.mockReturnValueOnce(9);
            spy.mockReturnValueOnce(1);

            const output = await service.batchCalculate(inputData, 0);

            expect(output.length).toBe(inputData.length);
            for (let i = 0; i < expectedOrder.length; i++) {
                expect(output[i].id).toBe(expectedOrder[i])
            }
        });
        it('should decrease weight of identical posts by total processed/seen (in same sec)', async () => {
            const RAW_SCORE = 100;
            const inputData: RawPost[] =
                [getRaw(0, "a"), getRaw(1, "a"), getRaw(2, "a"), getRaw(3, "a")];
            const calculateTotalSeenWeight = jest.spyOn(tLineCalculatorService, 'calculateTotalSeenWeight');
            calculateTotalSeenWeight.mockImplementation(jest.fn());
            jest.spyOn(tlineCacherService, 'dispatch').mockResolvedValue(0);
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore').mockReturnValue(RAW_SCORE);

            await service.batchCalculate(inputData, 0);

            expect(calculateTotalSeenWeight).toHaveBeenNthCalledWith(1, RAW_SCORE, 0);
            expect(calculateTotalSeenWeight).toHaveBeenNthCalledWith(2, RAW_SCORE, 1);
            expect(calculateTotalSeenWeight).toHaveBeenNthCalledWith(3, RAW_SCORE, 2);
            expect(calculateTotalSeenWeight).toHaveBeenNthCalledWith(4, RAW_SCORE, 3);
        });
    });

    //test utils

    describe('newBatch', () => {
        it('should return true every s numbers of an iteration', () => {
            const SIZE = 7;
            let cnt = 0;
            for (let i = 0; i <= 3 * SIZE; i++) {
                cnt++;
                if (service.newBatch(i, SIZE)) {
                    expect(cnt).toBe(SIZE);
                    cnt = 0;
                }
            }
        })
    })
});

function getRaw(id: number, sec?: string): RawPost {
    return {
        id: `MOCK${id}`,
        sec: sec ?? `tests${id}`,
        authorsPersonalScore: 10,
        postPersonalScore: 10,
        thrRelationalScore: 10,
        secRelationalScore: 10,
        autRelation: {follows: false, muted: true, score: 10},
        postState: {weight: 10, vote: 0, seen: false},
    }
}
