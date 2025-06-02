import { Test, TestingModule } from '@nestjs/testing';
import { ClearCacheService } from './clear-cache.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

describe('ClearCacheService', () => {
    let service: ClearCacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClearCacheService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getCachedData: jest.fn(),
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
