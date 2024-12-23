import { Module } from '@nestjs/common';
import { JobRunnerService } from './job-runner.service';
import { ClearCacheModule } from '../clear-cache/clear-cache.module';
import { InitCacheModule } from '../init-cache/init-cache.module';
import { LoadNextPostsModule } from '../load-next-posts/load-next-posts.module';
import { PostRankerManagerModule } from '../post-ranker-manager/post-ranker-manager.module';

@Module({
    providers: [JobRunnerService],
    exports: [JobRunnerService],
    imports: [
        ClearCacheModule,
        InitCacheModule,
        LoadNextPostsModule,
        PostRankerManagerModule,
    ],
})
export class JobRunnerModule {}
