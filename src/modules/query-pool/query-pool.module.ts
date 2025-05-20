import { Module } from '@nestjs/common';
import { FeedQuerierModule } from '../feed-querier/feed-querier.module';
import { QueryPoolService } from './query-pool.service';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';

@Module({
    providers: [QueryPoolService],
    exports: [QueryPoolService],
    imports: [FeedQuerierModule, TLineCalculatorModule],
})
export class QueryPoolModule {}
