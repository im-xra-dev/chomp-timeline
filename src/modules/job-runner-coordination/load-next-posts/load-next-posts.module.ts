import { Module } from '@nestjs/common';
import { LoadNextPostsService } from './load-next-posts.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [LoadNextPostsService],
    exports: [LoadNextPostsService],
    imports: [RedisCacheDriverModule],
})
export class LoadNextPostsModule {}
