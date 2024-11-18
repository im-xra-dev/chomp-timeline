import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerService} from './post-ranker.service';
import {describe, expect, it, beforeEach} from '@jest/globals';

describe('PostRankerService', () => {
    let service: PostRankerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PostRankerService],
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
    });

    describe('queryFollowedSectionPosts', () => {
        //mock calculate secs to Q
        //mock tlineCacheService read

        it('should drop negative posts', () => {
          //init / mock data
          //call rankPosts
          //ensure return val is 0
          //ensure no pooled post by this ID
        });
    });
});
