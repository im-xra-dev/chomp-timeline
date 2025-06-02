import { Module } from '@nestjs/common';
import { TLineModule } from './endpoints/t-line/t-line.module';
import { Stage2CalculationsModule } from './stage2-processing/stage2-calculations/stage2-calculations.module';
import { BatchCalculatorModule } from './stage2-processing/batch-calculator/batch-calculator.module';
import { BatchProcessorModule } from './stage3-processing/batch-processor/batch-processor.module';
import { QueryPoolModule } from './stage1-processing/query-pool/query-pool.module';
import { ClearCacheModule } from './job-runner-coordination/clear-cache/clear-cache.module';
import { InitCacheModule } from './job-runner-coordination/init-cache/init-cache.module';
import { LoadNextPostsModule } from './job-runner-coordination/load-next-posts/load-next-posts.module';
import { NeoDriverModule } from './neo-driver/neo-driver.module';
import { Stage2CacheManagementModule } from './stage2-processing/stage2-cache-management/stage2-cache-management.module';

@Module({
    imports: [
        TLineModule,
        Stage2CalculationsModule,
        BatchCalculatorModule,
        BatchProcessorModule,
        QueryPoolModule,
        ClearCacheModule,
        InitCacheModule,
        LoadNextPostsModule,
        NeoDriverModule,
        // Stage2CacheManagementModule,
    ],
})
export class AppModule {}
