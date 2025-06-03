import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastNewJobService } from './broadcast-new-job.service';

describe('BroadcastNewJobService', () => {
  let service: BroadcastNewJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BroadcastNewJobService],
    }).compile();

    service = module.get<BroadcastNewJobService>(BroadcastNewJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
