import {Test, TestingModule} from '@nestjs/testing';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {TLineService} from './t-line.service';
import {PostRankerService} from "../post-ranker/post-ranker.service";
import {NeoQueryService} from "../neo-query/neo-query.service";

describe('TLineService', () => {
    let service: TLineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TLineService,
                {
                    provide: PostRankerService,
                    useValue: {
                        rankPosts: jest.fn(),
                        queryFollowedSectionPosts: jest.fn(),
                    }
                },
            ],
        }).compile();

        service = module.get<TLineService>(TLineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
