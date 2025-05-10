import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { DispatcherModule } from '../dispatcher/dispatcher.module';
import { FeedQuerierModule } from '../feed-querier/feed-querier.module';

@Module({
    providers: [TLineService],
    controllers: [TLineController],
    imports: [DispatcherModule, FeedQuerierModule],
})
export class TLineModule {}
