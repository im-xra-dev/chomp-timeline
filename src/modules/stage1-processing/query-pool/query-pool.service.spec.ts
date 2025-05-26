import { Test, TestingModule } from '@nestjs/testing';
import { QueryPoolService } from './query-pool.service';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { Stage2CalculationsService } from '../../stage2-processing/stage2-calculations/stage2-calculations.service';
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
                    provide: Stage2CalculationsService,
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
