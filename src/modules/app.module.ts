import {Module} from '@nestjs/common';
import {TLineModule} from './t-line/t-line.module'
import { TLineCalculatorModule } from './t-line-calculator/t-line-calculator.module';
import { BatchCalculatorModule } from './batch-calculator/batch-calculator.module';
import { BatchProcessorService } from './batch-processor/batch-processor.service';
import { BatchProcessorModule } from './batch-processor/batch-processor.module';
import { QueryPoolService } from './query-pool/query-pool.service';
import { QueryPoolModule } from './query-pool/query-pool.module';
import { ClearCacheModule } from './clear-cache/clear-cache.module';
import { InitCacheModule } from './init-cache/init-cache.module';
import { LoadNextPostsModule } from './load-next-posts/load-next-posts.module';

@Module({
    imports: [TLineModule, TLineCalculatorModule, BatchCalculatorModule, BatchProcessorModule, QueryPoolModule, ClearCacheModule, InitCacheModule, LoadNextPostsModule],
    providers: [BatchProcessorService, QueryPoolService],
})
export class AppModule {
}
