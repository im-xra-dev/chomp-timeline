import { Module } from '@nestjs/common';
import { PostRankerManagerService } from './post-ranker-manager.service';
import { DispatcherModule } from '../../stage2-processing/dispatcher/dispatcher.module';
import { QueryPoolModule } from '../../stage1-processing/query-pool/query-pool.module';
import { BatchProcessorModule } from '../../stage3-processing/batch-processor/batch-processor.module';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [PostRankerManagerService],
    exports: [PostRankerManagerService],
    imports: [RedisCacheDriverModule, QueryPoolModule, DispatcherModule, BatchProcessorModule],
})
export class PostRankerManagerModule {}
