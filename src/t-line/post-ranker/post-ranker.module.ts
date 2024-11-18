import { Module } from '@nestjs/common';
import { PostRankerService } from './post-ranker.service';
import { NeoQueryModule } from '../../neo-query/neo-query.module';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';

@Module({
  providers: [PostRankerService],
  exports: [PostRankerService],
  imports: [NeoQueryModule, TlineCacherModule]
})
export class PostRankerModule {}
