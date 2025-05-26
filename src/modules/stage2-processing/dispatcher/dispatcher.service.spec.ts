import { Test, TestingModule } from '@nestjs/testing';
import { DispatcherService } from './dispatcher.service';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { TlineCacherService } from '../../tline-cacher/tline-cacher.service';
import { Stage2CalculationsService } from '../stage2-calculations/stage2-calculations.service';
import { TLineCalculatorConfigService } from '../../../configs/t-line-calculator.config/t-line-calculator.config.service';
import { RawPost, SortedPost } from '../../../utils/types';
import getRaw from '../../../utils/getRawPostObject.spec.util';
import { BatchCalculatorService } from '../batch-calculator/batch-calculator.service';

describe('DispatcherService', () => {
    let service: DispatcherService;
    let tLineCalculatorService: Stage2CalculationsService;
    let batchCalculatorService: BatchCalculatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DispatcherService,
                Stage2CalculationsService,
                TLineCalculatorConfigService,
                {
                    provide: BatchCalculatorService,
                    useValue: {
                        batchCalculate: jest.fn(),
                    },
                },
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                        mutex: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DispatcherService>(DispatcherService);
        tLineCalculatorService = module.get<Stage2CalculationsService>(Stage2CalculationsService);
        batchCalculatorService = module.get<BatchCalculatorService>(BatchCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dispatchConcurrentPosts', () => {
        it('should dispatch all posts to one batch in the order they came in', () => {
            const BATCH_COUNT = 1;
            const POST_COUNT = 14;

            //This test checks whether the system will dispatch all the posts
            //in the correct order

            const testData: RawPost[][] = [];

            jest.spyOn(tLineCalculatorService, 'calculateBatchCount').mockReturnValue(BATCH_COUNT);
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(
                async (test: RawPost[]): Promise<SortedPost[]> => {
                    testData.push(test);
                    return [];
                },
            );

            //populate the test data
            const inputPosts: RawPost[] = [];
            for (let inCnt = 0; inCnt < POST_COUNT; inCnt++) inputPosts.push(getRaw(inCnt));

            //out size and minscore are irrelevant, they are passed onto other functions
            //and their values are tested accordingly within those unit tests
            service.dispatchConcurrentPosts(inputPosts, 100, 0, "userId");

            //tests that the correct number of batches were dispatched
            expect(testData.length).toBe(BATCH_COUNT);

            //expects the first batch to contain 14 posts
            expect(testData[0].length).toBe(POST_COUNT);
            //check they are in the correct order
            for (let i = 0; i < POST_COUNT; i++) expect(testData[0][i].id).toBe('MOCK' + i);
        });

        it('should dispatch posts evenly across multiple batches', () => {
            //when there are multiple caches, all posts should be split evenly between them
            const BATCH_COUNT = 2;
            const POST_COUNT = 14;
            const POSTS_PER_BATCH = POST_COUNT / BATCH_COUNT;

            //This test checks whether the system will dispatch all the posts
            //in the correct order across multiple batches

            const testData: RawPost[][] = [];

            jest.spyOn(tLineCalculatorService, 'calculateBatchCount').mockReturnValue(BATCH_COUNT);
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(
                async (test: RawPost[]): Promise<SortedPost[]> => {
                    testData.push(test);
                    return [];
                },
            );

            //populate the test data
            const inputPosts: RawPost[] = [];
            for (let inCnt = 0; inCnt < POST_COUNT; inCnt++) inputPosts.push(getRaw(inCnt));

            //out size and minscore are irrelevant, they are passed onto other functions
            //and their values are tested accordingly within those unit tests
            service.dispatchConcurrentPosts(inputPosts, 100, 0, "userId");

            //tests that the correct number of batches were dispatched
            expect(testData.length).toBe(BATCH_COUNT);

            //expects the first batch to contain 7 posts
            expect(testData[0].length).toBe(POSTS_PER_BATCH);

            //check the first batch is in the correct order
            for (let i = 0; i < POSTS_PER_BATCH; i++) expect(testData[0][i].id).toBe('MOCK' + i);

            //expects the second batch to contain 7 posts
            expect(testData[1].length).toBe(POSTS_PER_BATCH);

            //check the second batch is in the correct order
            for (
                let i = 0;
                i < POSTS_PER_BATCH;
                i++ // starts @ end of 1st batch vv
            )
                expect(testData[1][i].id).toBe('MOCK' + (i + POSTS_PER_BATCH));
        });

        it('should dispatch one post more in the first batch than the second', () => {
            //when posts can not be evenly distributed, leftover posts should be
            //placed into the batches so that earlier batches contain one more than later batches
            //overflow posts are taken from the end of the input array, working backwards

            const BATCH_COUNT = 2;
            const POST_COUNT = 15;
            const POSTS_PER_BATCH = Math.floor(POST_COUNT / BATCH_COUNT);

            //This test checks whether the system will dispatch all the posts
            //in the correct order across multiple batches with uneven distribution

            const testData: RawPost[][] = [];

            jest.spyOn(tLineCalculatorService, 'calculateBatchCount').mockReturnValue(BATCH_COUNT);
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(
                async (test: RawPost[]): Promise<SortedPost[]> => {
                    testData.push(test);
                    return [];
                },
            );

            //populate the test data
            const inputPosts: RawPost[] = [];
            for (let inCnt = 0; inCnt < POST_COUNT; inCnt++) inputPosts.push(getRaw(inCnt));

            //out size and minscore are irrelevant, they are passed onto other functions
            //and their values are tested accordingly within those unit tests
            service.dispatchConcurrentPosts(inputPosts, 100, 0, "userId");

            //tests that the correct number of batches were dispatched
            expect(testData.length).toBe(BATCH_COUNT);

            //expects the first batch to contain 8 posts
            expect(testData[0].length).toBe(POSTS_PER_BATCH + 1);

            //check the first batch 7 posts in batch 1 are in the correct order
            for (let i = 0; i < POSTS_PER_BATCH; i++) expect(testData[0][i].id).toBe('MOCK' + i);

            //check that the last item was an overflow taken from the end
            expect(testData[0][POSTS_PER_BATCH].id).toBe('MOCK' + (POST_COUNT - 1));

            //expects the second batch to contain 7 posts
            expect(testData[1].length).toBe(POSTS_PER_BATCH);

            //check the second batch is in the correct order
            for (
                let i = 0;
                i < POSTS_PER_BATCH;
                i++ // starts @ end of 1st batch vv
            )
                expect(testData[1][i].id).toBe('MOCK' + (i + POSTS_PER_BATCH));
        });

        it('should dispatch multiple overflow posts correctly', () => {
            //it ensure that the all the overflow posts get dispatched

            const BATCH_COUNT = 10;
            const POST_COUNT = 15;
            const POSTS_PER_BATCH = Math.floor(POST_COUNT / BATCH_COUNT);
            const OVERFLOWS = POST_COUNT - POSTS_PER_BATCH * BATCH_COUNT;

            //This test checks whether the system will dispatch all the posts
            //in the correct order across multiple batches with uneven distribution

            const testData: RawPost[][] = [];

            jest.spyOn(tLineCalculatorService, 'calculateBatchCount').mockReturnValue(BATCH_COUNT);
            jest.spyOn(batchCalculatorService, 'batchCalculate').mockImplementation(
                async (test: RawPost[]): Promise<SortedPost[]> => {
                    testData.push(test);
                    return [];
                },
            );

            //populate the test data
            const inputPosts: RawPost[] = [];
            for (let inCnt = 0; inCnt < POST_COUNT; inCnt++) inputPosts.push(getRaw(inCnt));

            //out size and minscore are irrelevant, they are passed onto other functions
            //and their values are tested accordingly within those unit tests
            service.dispatchConcurrentPosts(inputPosts, 100, 0, "userId");

            //tests that the correct number of batches were dispatched
            expect(testData.length).toBe(BATCH_COUNT);

            //ensure all batches are of correct sizes
            for (let i = 0; i < OVERFLOWS; i++)
                expect(testData[i].length).toBe(POSTS_PER_BATCH + 1);

            for (let i = OVERFLOWS; i < BATCH_COUNT; i++)
                expect(testData[i].length).toBe(POSTS_PER_BATCH);

            //ensure that the first OVERFLOWS batches have their last element
            //being an overflow post, starting at the end and working backwards
            //from the original inputPosts

            for (let i = 0; i < OVERFLOWS; i++) {
                expect(testData[i][POSTS_PER_BATCH].id).toBe(`MOCK${POST_COUNT - i - 1}`);
            }
        });
    });
});
