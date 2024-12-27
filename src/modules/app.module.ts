import { Module } from '@nestjs/common';
import { TLineModule } from './t-line/t-line.module';
import { TLineCalculatorModule } from './t-line-calculator/t-line-calculator.module';
import { BatchCalculatorModule } from './batch-calculator/batch-calculator.module';
import { BatchProcessorModule } from './batch-processor/batch-processor.module';
import { QueryPoolModule } from './query-pool/query-pool.module';
import { ClearCacheModule } from './clear-cache/clear-cache.module';
import { InitCacheModule } from './init-cache/init-cache.module';
import { LoadNextPostsModule } from './load-next-posts/load-next-posts.module';
import { NeoDriverModule } from './neo-driver/neo-driver.module';

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
    ],
})
export class AppModule {}
