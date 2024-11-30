import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerService} from './post-ranker.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {TLineCalculatorConfigService} from '../../configs/t-line-calculator.config/t-line-calculator.config.service'
import {RawPost} from "../t-line/utils/types";
import getRaw from '../../utils/getRawPostObject.spec.util'
import {BatchCalculatorService} from "../batch-calculator/batch-calculator.service";

describe('PostRankerService', () => {
    let service: PostRankerService;
    let tLineCalculatorService: TLineCalculatorService;
    let batchCalculatorService: BatchCalculatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostRankerService,
                TLineCalculatorService,
                TLineCalculatorConfigService,
                {
                    provide: BatchCalculatorService,
                    useValue: {
                        batchCalculate: jest.fn(),
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
        batchCalculatorService = module.get<BatchCalculatorService>(BatchCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dispatchConcurrentPosts', () => {
        it('should dispatch a total of [bc] batches for given in&out sizes', () => {
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation()

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
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(mock);

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
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(mock);

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

    //test util functions

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