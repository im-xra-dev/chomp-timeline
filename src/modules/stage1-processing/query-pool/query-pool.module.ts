import { Module } from '@nestjs/common';
import { FeedQuerierModule } from '../feed-querier/feed-querier.module';
import { QueryPoolService } from './query-pool.service';
import { Stage2CalculationsModule } from '../../stage2-processing/stage2-calculations/stage2-calculations.module';

@Module({
    providers: [QueryPoolService],
    exports: [QueryPoolService],
    imports: [FeedQuerierModule, Stage2CalculationsModule],
})
export class QueryPoolModule {}
