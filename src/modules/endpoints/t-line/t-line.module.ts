import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { DispatcherModule } from '../../stage2-processing/dispatcher/dispatcher.module';
import { FeedQuerierModule } from '../../stage1-processing/feed-querier/feed-querier.module';

@Module({
    providers: [TLineService],
    controllers: [TLineController],
    imports: [DispatcherModule, FeedQuerierModule],
})
export class TLineModule {}
