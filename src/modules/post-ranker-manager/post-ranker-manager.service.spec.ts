import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerManagerService} from './post-ranker-manager.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {QueryPoolService} from "../query-pool/query-pool.service";

describe('PostRankerManagerService', () => {
    let service: PostRankerManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostRankerManagerService,
                {
                    provide: QueryPoolService,
                    useValue: {
                        queryAllModes: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PostRankerManagerService>(PostRankerManagerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
