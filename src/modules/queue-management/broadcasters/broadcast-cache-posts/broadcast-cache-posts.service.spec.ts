import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastCachePostsService } from './broadcast-cache-posts.service';

describe('BroadcastCachePostsService', () => {
  let service: BroadcastCachePostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BroadcastCachePostsService],
    }).compile();

    service = module.get<BroadcastCachePostsService>(BroadcastCachePostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
