import { Test, TestingModule } from '@nestjs/testing';
import { LoadNextPostsService } from './load-next-posts.service';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

describe('LoadNextPostsService', () => {
    let service: LoadNextPostsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoadNextPostsService,
                {
                    provide: RedisCacheDriverService,
                    useValue: {
                        getCachedData: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LoadNextPostsService>(LoadNextPostsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('move posts from specified caches to the finalpool cache', () => {
        it('should get a lock on all specified pools', async () => {});
        it('should get a move posts from each pool until final pool is filled', async () => {});
        it('remove all locks', async () => {});
    });
});
