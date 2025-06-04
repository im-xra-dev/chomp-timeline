import { Test, TestingModule } from '@nestjs/testing';
import { GenericBroadcasterService } from './generic-broadcaster.service';

describe('GenericBroadcasterService', () => {
  let service: GenericBroadcasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenericBroadcasterService],
    }).compile();

    service = module.get<GenericBroadcasterService>(GenericBroadcasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
