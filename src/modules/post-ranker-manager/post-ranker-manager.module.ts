import { Module } from '@nestjs/common';
import { PostRankerManagerService } from './post-ranker-manager.service';
import {QueryPoolService} from "../query-pool/query-pool.service";

@Module({
  providers: [PostRankerManagerService],
  exports: [PostRankerManagerService],
  imports: [QueryPoolService],
})
export class PostRankerManagerModule {}
