import { Test, TestingModule } from '@nestjs/testing';
import { BatchProcessorService } from './batch-processor.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('BatchProcessorService', () => {
    let service: BatchProcessorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BatchProcessorService],
        }).compile();

        service = module.get<BatchProcessorService>(BatchProcessorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('get a lock on the pre-cache', () => {
        it('should get a lock on the cache pool', async () => {});
    });
    describe('get the currently cached data', () => {
        it('should get the currently cached pool and associated metadata', async () => {});
        it('should get the current cachesize, if it is not specified by the job', async () => {});
    });
    describe('insert the processed batches in order of most relevant', () => {
        it('should add posts to the end of the cache if they are lower the current posts', async () => {});
        it('should insert posts in between higher and lower ranked posts', async () => {});
        it('should insert identical posts at the end of same ranked posts', async () => {});
        it('should not result in a cache size larger than the max cache size', async () => {});
        it('should not process posts ranked lower than the lowest score in a full cache', async () => {});
    });
    describe('handling metadata ', ()=>{
        it('should add metadata for added posts', async () => {});
        it('should delete metadata for removed posts that existed before re-ordering', async () => {});
        it('should remove posts from the pool where metadata was added by another process', async () => {});
    })
    describe('updating the cached data', () => {
        it('should increase per-category counts for added posts', async () => {});
        it('should decrease per-category counts for removed posts', async () => {});
        it('should not update per-category counts for posts stage to be added but then cancelled during metadata check', async () => {});
        it('should re-write the newly ordered list', async () => {});
    });
    describe('expiring of cache keys', () => {
        it('should set expire on the cache-pool list', async () => {});
        it('should set expire on all meta data added', async () => {});
        it('should set expire on all updated per-category', async () => {});
    });
    describe('remove the lock', () => {
        it('should remove the lock on the cache pool', async () => {});
    });
});
