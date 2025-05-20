import { Test, TestingModule } from '@nestjs/testing';
import { FeedQuerier } from './feed-querier.service';
import { NeoDriverService } from '../neo-driver/neo-driver.service';

describe('NeoQueryService', () => {
    let service: FeedQuerier;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeedQuerier,
                {
                    provide: NeoDriverService,
                    useValue: {
                        getSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<FeedQuerier>(FeedQuerier);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

});
