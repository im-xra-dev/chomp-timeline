import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerService} from './post-ranker.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {NeoQueryService} from "../neo-query/neo-query.service";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";

describe('PostRankerService', () => {
    let service: PostRankerService;

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
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('rankPosts', () => {
        //mock calculate score
        //mock total seen weight
        //mock tlineCacheService CacheState to pass to func

        it('should drop negative posts', () => {
            //init / mock data
            //call rankPosts
            //ensure return val is 0
            //ensure no pooled post by this ID
        });

        it('should drop 0 score posts', () => {
            //init / mock data
            //call rankPosts
            //ensure return val is 0
            //ensure no pooled post by this ID
        });

        it('should insert at 0 if pool empty', () => {
            //init / mock data
            //call rankPosts
            //ensure return val is 1
            //ensure pooled post by this ID
        });

        it('should place posts in the correct order in the pool', () => {
            //init / mock data
            //call rankPosts
            //ensure return val is 1
            //ensure pooled post by this ID at correct index

            //boundry data for data with close values
            //test first place
            //test last place
            //test when 2 scores are equal

        });

        it('should remove any posts seen in this session', () => {
            //init / mock data
            //call rankPosts
            //ensure seen=true results in drop and not false
        });

    });

    describe('queryFollowedSectionPosts', () => {
        //mock calculate secs to Q
        //mock sec cache pop
        //mock neo query
        //mock seen cache check
        //mock sec cache set

        it('should pop the right number of posts', () => {
            //init / mock data
            //call rankPosts
            //ensure 0, 1, 10 posts popped
        });

        it('should place secs in the correct order in the pool', () => {
            //see above for posts
        });
    });
});
