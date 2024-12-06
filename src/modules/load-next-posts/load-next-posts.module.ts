import { Module } from '@nestjs/common';
import { LoadNextPostsService } from './load-next-posts.service';
import {TlineCacherModule} from "../tline-cacher/tline-cacher.module";

@Module({
  providers: [LoadNextPostsService],
  exports: [LoadNextPostsService],
  imports: [TlineCacherModule],
})
export class LoadNextPostsModule {}
