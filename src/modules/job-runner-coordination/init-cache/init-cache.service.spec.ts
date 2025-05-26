import { Test, TestingModule } from '@nestjs/testing';
import { InitCacheService } from './init-cache.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

describe('InitCacheService', () => {
    let service: InitCacheService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InitCacheService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getCachedData: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<InitCacheService>(InitCacheService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
