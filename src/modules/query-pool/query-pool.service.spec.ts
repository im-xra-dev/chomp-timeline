import {Test, TestingModule} from '@nestjs/testing';
import {QueryPoolService} from './query-pool.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";
import {NeoQueryService} from "../neo-query/neo-query.service";

describe('QueryPoolService', () => {
    let service: QueryPoolService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QueryPoolService,
                {
                    provide: NeoQueryService,
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
