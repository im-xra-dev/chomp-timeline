import { Test, TestingModule } from '@nestjs/testing';
import { TlineCacherService } from './tline-cacher.service';

describe('TlineCacherService', () => {
  let service: TlineCacherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TlineCacherService],
    }).compile();

    service = module.get<TlineCacherService>(TlineCacherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
