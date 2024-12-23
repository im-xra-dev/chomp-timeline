import { Test, TestingModule } from '@nestjs/testing';
import { NeoQueryService } from './neo-query.service';

describe('NeoQueryService', () => {
    let service: NeoQueryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NeoQueryService],
        }).compile();

        service = module.get<NeoQueryService>(NeoQueryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
