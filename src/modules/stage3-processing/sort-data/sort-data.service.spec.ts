import { Test, TestingModule } from '@nestjs/testing';
import { CachedPostObj, SortDataService } from './sort-data.service';
import { describe, expect, it } from '@jest/globals';
import {
    GET_CACHE_DATA_WITH_SIZE,
    GET_CACHE_DATA_WITHOUT_SIZE,
} from './cache-get-data.spec.util';

describe('SortDataService', () => {
  let service: SortDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SortDataService],
    }).compile();

    service = module.get<SortDataService>(SortDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

    //mock a single post
    const getMockedPost = (score: number, id = "FFFFFF") => ({
        id: id,
        sec: 'sec',
        seen: false,
        vote: 0,
        score: score,
    });

    const getCachedPostObj = (id: string, score: number): CachedPostObj => {
        return {id, score};
    }

    const getDefaultCache = () => {
        return [
            getCachedPostObj('AAAAAA', 90),
            getCachedPostObj('BBBBBB', 80),
            getCachedPostObj('CCCCCC', 70),
            getCachedPostObj('DDDDDD', 60),
            getCachedPostObj('EEEEEE', 50),
        ]
    }

    describe('parse redis data', () => {
        //redis returns data in the form [optionalMetaData, id, score, id, score, ...]
        it('should parse the data with no skip', () => {
            const output = service.parseCurrentCachedData(GET_CACHE_DATA_WITHOUT_SIZE, 0);
            expect(output.length).toBe(2);
            expect(output[0].id).toBe("ID1");
            expect(output[0].id).toBe("ID2");
        });
        it('should parse the data with a skip', () => {
            const output = service.parseCurrentCachedData(GET_CACHE_DATA_WITH_SIZE, 1);
            expect(output.length).toBe(2);
            expect(output[0].id).toBe("ID1");
            expect(output[0].id).toBe("ID2");
        });
    });

    describe('insert the processed batches in order of most relevant', () => {
        const CACHE_MAX_SIZE = 10;
        const TEST_POST_ID = "FFFFFF";

        const runTest = (postScore: number, expectedIndex: number, expectedLength: number, maxSize = CACHE_MAX_SIZE) => {
            const post = getMockedPost(postScore, TEST_POST_ID);

            //run test
            const sortedList = service.sortData(maxSize, getDefaultCache(), [[post]]);
            expect(sortedList[expectedIndex].id).toBe(TEST_POST_ID);
            expect(sortedList.length).toBe(expectedLength);
        }

        it('should add posts to the end of the cache if they are lower than the current posts', () => {
            runTest(49, 5, 6);
        });

        it('should insert posts in between higher and lower ranked posts', () => {
            runTest(51, 4, 6);
        });

        it('should insert identical posts at the end of same ranked posts', () => {
            runTest(60, 4, 6);
        });

        it('should not have a cache too large if it was full but an element was inserted', () => {
            const MAX_SIZE = 5;
            runTest(100, 0, MAX_SIZE, MAX_SIZE);
        });

        it('should not process posts ranked lower than the lowest score in a full cache', () => {
            const MAX_SIZE = 5;
            const post = getMockedPost(49, TEST_POST_ID);

            //run test
            const sortedList = service.sortData(MAX_SIZE, getDefaultCache(), [[post]]);

            expect(sortedList.length).toBe(MAX_SIZE);
            for(let i = 0; i < MAX_SIZE; i++) expect(sortedList[i].id).not.toBe(TEST_POST_ID);
        });
    });

});
