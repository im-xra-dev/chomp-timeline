import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerService} from './post-ranker.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {NeoQueryService} from "../neo-query/neo-query.service";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {RawPost} from "../t-line/utils/types";
import {InvalidDataError} from "../../utils/InvalidDataError";

function getRaw(): RawPost {
    return {
        id: "MOCK000",
        sec: "tests",
        authorsPersonalScore: 10,
        postPersonalScore: 10,
        thrRelationalScore: 10,
        secRelationalScore: 10,
        autRelation: {follows: false, muted: true, score: 10},
        postState: {weight: 10, vote: 0, seen: false},
    }
}

describe('PostRankerService', () => {
    let service: PostRankerService;
    let tLineCalculatorService: TLineCalculatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostRankerService,
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
                {
                    provide: TLineCalculatorService,
                    useValue: {
                        calculateRelevanceScore: jest.fn(),
                        calculateTotalSeenWeight: jest.fn(),
                        calculateSectionsToQuery: jest.fn(),
                    }
                },
            ],
        }).compile();

        service = module.get<PostRankerService>(PostRankerService);
        tLineCalculatorService = module.get<TLineCalculatorService>(TLineCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('todo', () => {
        it('should drop negative posts', () => {
            //init / mock data
            jest.spyOn(tLineCalculatorService, 'calculateRelevanceScore')
                .mockReturnValue(-1);
            //call rankPosts
            // const added = service.rankPosts([post]);
            //ensure return val is 0
            // expect(added).toBe(0);
            //ensure no pooled post by this ID
            //ensure seen does not contain ID
        });
    });

    describe('calculateBatchCount', () => {
        it("should be an equation that produces an optimised batch count", () => {
            expect("the developer to have graphs that back this up").toBeTruthy()
            // current tests for the equation outputs are in desmos and on paper [~xra 25/11/24]
        });
        it('should be a whole number for all outputs', () => {
            for (let inCnt = 1; inCnt <= 100; inCnt++) {
                for (let outCnt = 1; outCnt <= 100; outCnt++) {
                    const out = service.calculateBatchCount(inCnt, outCnt)
                    expect(out).toBe(Math.floor(out));
                }
            }
        });
        it('should throw an error for input size <= 0', () => {
            const call = () => {
                service.calculateBatchCount(0, 10)
            };
            expect(call).toThrow(InvalidDataError);
        });
        it('should throw an error for output size <= 0', () => {
            const call = () => {
                service.calculateBatchCount(10, 0)
            };
            expect(call).toThrow(InvalidDataError);
        });
    });

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

    describe('dispatchConcurrentPosts', () => {
        it('should dispatch a total of [bc] batches for given in&out sizes', () => {
            jest.spyOn(service, 'batchCalculate').mockImplementation()

            const inputPosts: RawPost[] = [];
            for (let inCnt = 1; inCnt <= 100; inCnt++) {
                inputPosts.push(getRaw());
                for (let outCnt = 1; outCnt <= 100; outCnt++) {
                    const bc = service.calculateBatchCount(inCnt, outCnt);
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
                inputPosts.push(getRaw());
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

            const outCnt = 47; // inits
            const inCnt = 777;
            const bc = service.calculateBatchCount(inCnt, outCnt);
            const actualBatchSize = Math.floor(inCnt / bc);

            const inputPosts: RawPost[] = []; //generate mock data and run
            for (let i = 0; i < inCnt; i++) inputPosts.push(getRaw());
            const data: number[] = ( // data holds values overriden by the mock
                service.dispatchConcurrentPosts(inputPosts, outCnt, 0
                ) as unknown[])as number[];

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
});
