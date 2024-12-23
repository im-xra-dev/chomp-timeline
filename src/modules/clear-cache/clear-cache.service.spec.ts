import { Test, TestingModule } from '@nestjs/testing';
import { ClearCacheService } from './clear-cache.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { TlineCacherService } from '../tline-cacher/tline-cacher.service';

describe('ClearCacheService', () => {
    let service: ClearCacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClearCacheService,
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClearCacheService>(ClearCacheService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
