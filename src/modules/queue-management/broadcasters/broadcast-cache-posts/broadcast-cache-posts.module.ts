import { Module } from '@nestjs/common';
import { BroadcastCachePostsService } from './broadcast-cache-posts.service';

@Module({
  providers: [BroadcastCachePostsService]
})
export class BroadcastCachePostsModule {}
