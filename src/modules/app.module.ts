import { Module } from '@nestjs/common';
import { TLineModule } from './endpoints/t-line/t-line.module';
import { TLineCalculatorModule } from './stage2-processing/t-line-calculator/t-line-calculator.module';
import { BatchCalculatorModule } from './stage2-processing/batch-calculator/batch-calculator.module';
import { BatchProcessorModule } from './stage2-processing/batch-processor/batch-processor.module';
import { QueryPoolModule } from './stage1-processing/query-pool/query-pool.module';
import { ClearCacheModule } from './job-runner-coordination/clear-cache/clear-cache.module';
import { InitCacheModule } from './job-runner-coordination/init-cache/init-cache.module';
import { LoadNextPostsModule } from './stage1-processing/load-next-posts/load-next-posts.module';
import { NeoDriverModule } from './neo-driver/neo-driver.module';
import { Stage2CacheManagementModule } from './stage2-processing/stage2-cache-management/stage2-cache-management.module';

@Module({
    imports: [
        TLineModule,
        TLineCalculatorModule,
        BatchCalculatorModule,
        BatchProcessorModule,
        QueryPoolModule,
        ClearCacheModule,
        InitCacheModule,
        LoadNextPostsModule,
        NeoDriverModule,
        Stage2CacheManagementModule,
    ],
})
export class AppModule {}
