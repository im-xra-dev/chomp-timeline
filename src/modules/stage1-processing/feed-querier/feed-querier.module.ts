import { Module } from '@nestjs/common';
import { FeedQuerier } from './feed-querier.service';
import { NeoDriverModule } from '../../neo-driver/neo-driver.module';

@Module({
    providers: [FeedQuerier],
    exports: [FeedQuerier],
    imports: [NeoDriverModule],
})
export class FeedQuerierModule {}
