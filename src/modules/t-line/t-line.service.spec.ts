import {Test, TestingModule} from '@nestjs/testing';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {TLineService} from './t-line.service';

describe('TLineService', () => {
    let service: TLineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TLineService],
        }).compile();

        service = module.get<TLineService>(TLineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
