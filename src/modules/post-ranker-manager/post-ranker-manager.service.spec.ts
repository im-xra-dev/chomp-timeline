import {Test, TestingModule} from '@nestjs/testing';
import {PostRankerManagerService} from './post-ranker-manager.service';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {QueryPoolService} from "../query-pool/query-pool.service";
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";
import {DispatcherService} from "../dispatcher/dispatcher.service";
import {BatchProcessorService} from "../batch-processor/batch-processor.service";

describe('PostRankerManagerService', () => {
    let service: PostRankerManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostRankerManagerService,
                {
                    provide: QueryPoolService,
                    useValue: {
                        queryAllModes: jest.fn(),
                    },
                },
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                    },
                },
                {
                    provide: DispatcherService,
                    useValue: {
                        dispatchConcurrentPosts: jest.fn(),
                    },
                },
                {
                    provide: BatchProcessorService,
                    useValue: {
                        processBatches: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PostRankerManagerService>(PostRankerManagerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
