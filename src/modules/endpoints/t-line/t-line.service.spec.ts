import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { TLineService } from './t-line.service';
import { DispatcherService } from '../../stage2-processing/dispatcher/dispatcher.service';

describe('TLineService', () => {
    let service: TLineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TLineService,
                {
                    provide: DispatcherService,
                    useValue: {
                        rankPosts: jest.fn(),
                        queryFollowedSectionPosts: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TLineService>(TLineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
