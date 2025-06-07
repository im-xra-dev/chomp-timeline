import { Test, TestingModule } from '@nestjs/testing';
import { MetadataManagementService } from './metadata-management.service';
import { describe, expect, it } from '@jest/globals';
import { CachedPostObj } from '../sort-data/sort-data.service';

describe('MetadataManagementService', () => {
    let service: MetadataManagementService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MetadataManagementService],
        }).compile();

        service = module.get<MetadataManagementService>(MetadataManagementService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    const getCachedPostObj = (id: string, score: number): CachedPostObj => {
        return { id, score };
    };

    describe('handling metadata ', () => {
        it('retrieve all the new and removed posts in this cache pool', () => {
            const originalCache = [
                getCachedPostObj('AAAAAA', 90),
                getCachedPostObj('BBBBBB', 80),
                getCachedPostObj('CCCCCC', 70),
                getCachedPostObj('DDDDDD', 60),
                getCachedPostObj('EEEEEE', 50),
            ];
            const proposedCache = [
                getCachedPostObj('NEW000', 100),
                getCachedPostObj('AAAAAA', 90),
                getCachedPostObj('NEW111', 85),
                getCachedPostObj('BBBBBB', 80),
                getCachedPostObj('CCCCCC', 70),
            ];

            const output = service.getAdditionsAndRemovals(proposedCache, originalCache);

            //test new posts
            expect(output.newPosts).toContain('NEW000');
            expect(output.newPosts).toContain('NEW111');
            expect(output.newPosts.length).toBe(2);

            //test removed posts
            expect(output.newPosts).toContain('DDDDDD');
            expect(output.newPosts).toContain('EEEEEE');
            expect(output.newPosts.length).toBe(2);
        });

        it('should remove posts from the proposed pool if the metadata could not be set', () => {
            const removedId = 'CCCCCC';

            //function to generate redis response data
            const getRedisData = (count: number, failIndex: number) => {
                const data = [];
                //first section relates to the created metadata, each metadata currently contains 3 fields
                for (let i = 0; i < count; i++) {
                    //0 indicates fail, 1 indicates success
                    if (i === failIndex) data.push(0, 0, 0);
                    else data.push(1, 1, 1);
                }
                //trailing data relates to deleted old meta and should be ignored
                data.push(0,0,1,1,0);
                return data;
            };

            //mock proposed cache
            const proposedCache = [
                getCachedPostObj('AAAAAA', 90),
                getCachedPostObj('BBBBBB', 80),
                getCachedPostObj(removedId, 70),
                getCachedPostObj('DDDDDD', 60),
                getCachedPostObj('EEEEEE', 50),
            ];
            //new posts to the batch, but removedId (index 1) failed in redis
            const newPosts = ['AAAAAA', removedId];
            const redisData = getRedisData(newPosts.length, 1);

            const output = service.removePostsThatFailedMetaWrite(redisData, newPosts, proposedCache);

            expect(output.length).toBe(proposedCache.length-1);
            expect(output).not.toContain(removedId);
        });
    });
});
