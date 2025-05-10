import { Test, TestingModule } from '@nestjs/testing';
import { QueryPoolService } from './query-pool.service';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { TLineCalculatorService } from '../t-line-calculator/t-line-calculator.service';
import { FeedQuerier } from '../feed-querier/feed-querier.service';

describe('QueryPoolService', () => {
    let service: QueryPoolService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QueryPoolService,
                {
                    provide: FeedQuerier,
                    useValue: {
                        read: jest.fn(),
                    },
                },
                {
                    provide: TLineCalculatorService,
                    useValue: {
                        calculateSectionsToQuery: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QueryPoolService>(QueryPoolService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
