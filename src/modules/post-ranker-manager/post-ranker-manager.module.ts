import { Module } from '@nestjs/common';
import { PostRankerManagerService } from './post-ranker-manager.service';
import {TlineCacherModule} from "../tline-cacher/tline-cacher.module";
import {DispatcherModule} from "../dispatcher/dispatcher.module";
import {QueryPoolModule} from "../query-pool/query-pool.module";
import {BatchProcessorModule} from "../batch-processor/batch-processor.module";

@Module({
  providers: [PostRankerManagerService],
  exports: [PostRankerManagerService],
  imports: [TlineCacherModule, QueryPoolModule, DispatcherModule, BatchProcessorModule],
})
export class PostRankerManagerModule {}
