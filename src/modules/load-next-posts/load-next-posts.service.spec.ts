import {Test, TestingModule} from '@nestjs/testing';
import {LoadNextPostsService} from './load-next-posts.service';
import {beforeEach, describe, expect, it} from '@jest/globals';
import {TlineCacherService} from "../tline-cacher/tline-cacher.service";

describe('LoadNextPostsService', () => {
    let service: LoadNextPostsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoadNextPostsService,
                {
                    provide: TlineCacherService,
                    useValue: {
                        dispatch: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LoadNextPostsService>(LoadNextPostsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
